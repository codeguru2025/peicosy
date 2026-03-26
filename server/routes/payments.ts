import type { Express } from "express";
import { storage } from "../storage";
import { OrderStatus, paynowInitiateSchema, paynowMobileSchema } from "@shared/schema";
import { isAuthenticated } from "../auth";
import { generatePayFastForm, isPayFastConfigured, validatePayFastITN } from "../payfast";
import { isPaynowConfigured, initiateWebPayment, initiateMobilePayment, checkPaymentStatus, validatePaynowHash } from "../paynow";
import { logPaymentEvent } from "./utils";
import { fromZodError } from "zod-validation-error";

export function registerPaymentRoutes(app: Express) {
  app.get("/api/payment/status", (req, res) => {
    res.json({ 
      payfast: isPayFastConfigured(),
      paynow: isPaynowConfigured(),
      manual: true
    });
  });

  app.post("/api/payment/payfast/initiate", isAuthenticated, async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!isPayFastConfigured()) {
        return res.status(503).json({ 
          message: "PayFast is not configured. Please use manual bank transfer." 
        });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const exchangeRateData = await storage.getExchangeRate('GBP', 'ZAR');
      const exchangeRate = exchangeRateData ? Number(exchangeRateData.rate) : 23.50;
      const amountZAR = Number(order.totalAmount) * exchangeRate;
      
      const user = req.user as any;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const paymentData = generatePayFastForm(
        {
          orderId: order.id,
          amount: amountZAR,
          itemName: `Peicosy Order #${order.id}`,
          itemDescription: `Luxury goods order - ${order.items?.length || 0} items`,
          customerEmail: user.claims?.email || "",
          customerFirstName: user.claims?.first_name,
          customerLastName: user.claims?.last_name,
        },
        `${baseUrl}/payment/success?order_id=${order.id}`,
        `${baseUrl}/payment/cancel?order_id=${order.id}`,
        `${baseUrl}/api/payment/payfast/notify`
      );
      
      res.json(paymentData);
    } catch (err: any) {
      console.error("PayFast initiate error:", err);
      res.status(500).json({ message: err.message || "Failed to initiate payment" });
    }
  });

  app.post("/api/payment/payfast/notify", async (req, res) => {
    try {
      if (!isPayFastConfigured()) {
        return res.status(503).send("PayFast not configured");
      }
      
      const pfPaymentId = req.body.pf_payment_id || req.body.m_payment_id;
      
      logPaymentEvent("PAYFAST_ITN_RECEIVED", {
        orderId: req.body.m_payment_id,
        pfPaymentId,
        status: req.body.payment_status,
        amount: req.body.amount_gross,
      });
      
      const result = validatePayFastITN(req.body);
      
      if (!result.valid) {
        logPaymentEvent("PAYFAST_ITN_REJECTED", {
          reason: "INVALID_SIGNATURE",
          orderId: req.body.m_payment_id,
        });
        return res.status(400).send("Invalid signature");
      }
      
      if (!result.amount || result.amount <= 0) {
        logPaymentEvent("PAYFAST_ITN_REJECTED", {
          reason: "MISSING_OR_INVALID_AMOUNT",
          orderId: result.orderId,
          rawAmount: req.body.amount_gross,
        });
        return res.status(400).send("Invalid payment amount");
      }
      
      // ACID: Atomically claim this callback — prevents duplicate processing
      if (pfPaymentId) {
        const claimed = await storage.tryClaimCallback('payfast', pfPaymentId, result.orderId, req.body);
        if (!claimed) {
          logPaymentEvent("PAYFAST_ITN_DUPLICATE_IDEMPOTENCY", {
            pfPaymentId,
            orderId: result.orderId,
          });
          return res.status(200).send("Already processed");
        }
      }
      
      const order = await storage.getOrder(result.orderId);
      if (!order) {
        logPaymentEvent("PAYFAST_ITN_REJECTED", {
          reason: "ORDER_NOT_FOUND",
          orderId: result.orderId,
        });
        return res.status(404).send("Order not found");
      }
      
      const expectedAmountZAR = order.expectedAmountZar 
        ? Number(order.expectedAmountZar)
        : Number(order.totalAmount) * 23.50;
      const tolerance = 0.05;
      
      if (Math.abs(result.amount - expectedAmountZAR) > expectedAmountZAR * tolerance) {
        logPaymentEvent("PAYFAST_AMOUNT_MISMATCH", {
          orderId: result.orderId,
          expectedAmount: expectedAmountZAR.toFixed(2),
          receivedAmount: result.amount.toFixed(2),
          difference: Math.abs(result.amount - expectedAmountZAR).toFixed(2),
        });
        return res.status(400).send("Amount mismatch");
      }
      
      // ACID: Atomically check-and-update order status with row lock
      if (result.paymentStatus === "COMPLETE") {
        const updated = await storage.confirmOrderPayment(result.orderId, OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED);
        if (updated) {
          logPaymentEvent("PAYFAST_PAYMENT_CONFIRMED", {
            orderId: result.orderId,
            amount: result.amount,
            pfPaymentId,
          });
        } else {
          logPaymentEvent("PAYFAST_ITN_ALREADY_PROCESSED", {
            orderId: result.orderId,
            currentStatus: order.status,
          });
        }
      } else if (result.paymentStatus === "CANCELLED") {
        await storage.confirmOrderPayment(result.orderId, OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED);
        logPaymentEvent("PAYFAST_PAYMENT_CANCELLED", {
          orderId: result.orderId,
          pfPaymentId,
        });
      }
      
      // Finalize the claimed callback record with actual status
      if (pfPaymentId) {
        try {
          await storage.finalizeClaimedCallback('payfast', pfPaymentId, result.paymentStatus, String(result.amount));
        } catch (err: any) {
          console.error("Failed to finalize PayFast callback record (non-critical):", err);
        }
      }
      
      res.status(200).send("OK");
    } catch (err) {
      logPaymentEvent("PAYFAST_ITN_ERROR", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      res.status(500).send("Error processing notification");
    }
  });

  app.post("/api/payment/paynow/initiate", isAuthenticated, async (req, res) => {
    try {
      const validation = paynowInitiateSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ message: error.message });
      }
      
      const { orderId } = validation.data;
      const user = req.user as any;
      
      if (!isPaynowConfigured()) {
        return res.status(503).json({ 
          message: "Paynow is not currently available. Please use another payment method." 
        });
      }
      
      logPaymentEvent("PAYNOW_WEB_INITIATED", {
        orderId,
        userId: user.id || user.claims?.sub,
      });
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== user.claims?.sub && order.userId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this order." });
      }

      const orderWithItems = await storage.getOrderWithItems(orderId);
      
      const exchangeRateData = await storage.getExchangeRate('GBP', 'USD');
      const exchangeRate = exchangeRateData ? Number(exchangeRateData.rate) : 1.27;
      const amountUSD = Number(order.totalAmount) * exchangeRate;
      
      const items = orderWithItems?.items?.map(item => ({
        name: item.product?.name || `Item ${item.productId}`,
        amount: Number(item.priceAtPurchase) * item.quantity * exchangeRate,
      })) || [{ name: `Peicosy Order #${order.id}`, amount: amountUSD }];
      
      const result = await initiateWebPayment({
        orderId: order.id,
        amount: amountUSD,
        email: user.claims?.email || "customer@peicosy.com",
        reference: `PEICOSY-${order.id}-${Date.now()}`,
        items,
      });
      
      if (result.success) {
        await storage.updateOrderPaynowPollUrl(order.id, result.pollUrl || '');
        
        res.json({
          success: true,
          redirectUrl: result.redirectUrl,
          pollUrl: result.pollUrl,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || "Unable to initiate payment. Please try again.",
        });
      }
    } catch (err: any) {
      console.error("Paynow initiate error:", err);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/payment/paynow/mobile", isAuthenticated, async (req, res) => {
    try {
      const validation = paynowMobileSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ message: error.message });
      }
      
      const { orderId, phone, method } = validation.data;
      const user = req.user as any;
      
      if (!isPaynowConfigured()) {
        return res.status(503).json({ 
          message: "Paynow is not currently available. Please use another payment method." 
        });
      }
      
      logPaymentEvent("PAYNOW_MOBILE_INITIATED", {
        orderId,
        method,
        userId: user.id || user.claims?.sub,
      });
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== user.claims?.sub && order.userId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this order." });
      }

      const orderWithItems = await storage.getOrderWithItems(orderId);
      
      const exchangeRateData = await storage.getExchangeRate('GBP', 'USD');
      const exchangeRate = exchangeRateData ? Number(exchangeRateData.rate) : 1.27;
      const amountUSD = Number(order.totalAmount) * exchangeRate;
      
      const items = orderWithItems?.items?.map(item => ({
        name: item.product?.name || `Item ${item.productId}`,
        amount: Number(item.priceAtPurchase) * item.quantity * exchangeRate,
      })) || [{ name: `Peicosy Order #${order.id}`, amount: amountUSD }];
      
      const result = await initiateMobilePayment({
        orderId: order.id,
        amount: amountUSD,
        email: user.claims?.email || "customer@peicosy.com",
        reference: `PEICOSY-${order.id}-${Date.now()}`,
        items,
        phone,
        method,
      });
      
      if (result.success) {
        await storage.updateOrderPaynowPollUrl(order.id, result.pollUrl || '');
        
        res.json({
          success: true,
          pollUrl: result.pollUrl,
          instructions: result.instructions || `Please check your ${method === 'ecocash' ? 'Ecocash' : 'OneMoney'} phone for a payment prompt.`,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || "Unable to initiate payment. Please try again.",
        });
      }
    } catch (err: any) {
      console.error("Paynow mobile error:", err);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.get("/api/payment/paynow/status/:orderId", isAuthenticated, async (req, res) => {
    try {
      const orderId = Number(req.params.orderId);
      const user = req.user as any;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== user.claims?.sub && order.userId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this order." });
      }
      
      const pollUrl = await storage.getOrderPaynowPollUrl(orderId);
      
      if (!pollUrl) {
        return res.json({ 
          status: "no_payment",
          message: "No Paynow payment found for this order.",
        });
      }
      
      const status = await checkPaymentStatus(pollUrl);
      
      if (status.paid) {
        // ACID: Atomically check-and-update order status with row lock
        await storage.confirmOrderPayment(orderId, OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED);
        
        res.json({
          status: "paid",
          message: "Payment received successfully!",
          paid: true,
        });
      } else {
        res.json({
          status: status.status,
          message: "Payment is pending.",
          paid: false,
        });
      }
    } catch (err: any) {
      console.error("Paynow status check error:", err);
      res.status(500).json({ message: "Unable to check payment status." });
    }
  });

  app.post("/api/payments/paynow/callback", async (req, res) => {
    try {
      const paynowTxId = req.body.paynowreference;
      
      logPaymentEvent("PAYNOW_CALLBACK_RECEIVED", {
        reference: req.body.reference,
        paynowReference: paynowTxId,
        status: req.body.status,
        amount: req.body.amount,
      });
      
      if (!validatePaynowHash(req.body)) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "INVALID_HASH",
          reference: req.body.reference,
        });
        return res.status(401).send("Invalid signature");
      }
      
      const { reference, paynowreference, status, amount, pollurl } = req.body;
      
      const match = reference?.match(/PEICOSY-(\d+)-/);
      const orderId = match ? parseInt(match[1]) : null;
      
      if (!orderId) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "INVALID_REFERENCE_FORMAT",
          reference,
        });
        return res.status(400).send("Invalid reference");
      }

      // ACID: Atomically claim this callback — prevents duplicate processing
      if (paynowTxId) {
        const claimed = await storage.tryClaimCallback('paynow', paynowTxId, orderId, req.body);
        if (!claimed) {
          logPaymentEvent("PAYNOW_CALLBACK_DUPLICATE_IDEMPOTENCY", {
            paynowReference: paynowTxId,
            reference,
          });
          return res.status(200).send("Already processed");
        }
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "ORDER_NOT_FOUND",
          orderId,
          reference,
        });
        return res.status(404).send("Order not found");
      }

      const storedPollUrl = await storage.getOrderPaynowPollUrl(orderId);
      if (!storedPollUrl) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "NO_STORED_POLL_URL",
          orderId,
          reference,
        });
        return res.status(400).send("No pending Paynow payment for this order");
      }

      const verifiedStatus = await checkPaymentStatus(storedPollUrl);
      
      if (verifiedStatus.amount !== undefined) {
        const expectedAmountUSD = order.expectedAmountUsd 
          ? Number(order.expectedAmountUsd)
          : Number(order.totalAmount) * 1.27;
        const tolerance = 0.05;
        
        if (Math.abs(verifiedStatus.amount - expectedAmountUSD) > expectedAmountUSD * tolerance) {
          logPaymentEvent("PAYNOW_AMOUNT_MISMATCH", {
            orderId,
            expectedAmount: expectedAmountUSD.toFixed(2),
            receivedAmount: verifiedStatus.amount.toFixed(2),
            difference: Math.abs(verifiedStatus.amount - expectedAmountUSD).toFixed(2),
          });
          return res.status(400).send("Amount mismatch");
        }
      }
      
      logPaymentEvent("PAYNOW_CALLBACK_VERIFIED", {
        orderId,
        reference,
        paynowReference: paynowreference,
        callbackStatus: status,
        verifiedStatus: verifiedStatus.status,
        verifiedPaid: verifiedStatus.paid,
        amount: verifiedStatus.amount,
      });

      // ACID: Atomically check-and-update order status with row lock
      if (verifiedStatus.paid) {
        const updated = await storage.confirmOrderPayment(orderId, OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED);
        if (updated) {
          logPaymentEvent("PAYNOW_PAYMENT_CONFIRMED", {
            orderId,
            reference,
            paynowReference: paynowreference,
            amount: verifiedStatus.amount,
            newStatus: OrderStatus.CONFIRMED,
          });
        }
      } else if (verifiedStatus.status === 'Cancelled') {
        await storage.confirmOrderPayment(orderId, OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED);
        logPaymentEvent("PAYNOW_PAYMENT_CANCELLED", {
          orderId,
          reference,
          paynowReference: paynowreference,
        });
      } else {
        logPaymentEvent("PAYNOW_CALLBACK_PENDING", {
          orderId,
          reference,
          status: verifiedStatus.status,
        });
      }
      
      // Finalize the claimed callback record with actual status
      if (paynowTxId) {
        try {
          await storage.finalizeClaimedCallback('paynow', paynowTxId, verifiedStatus.status, verifiedStatus.amount ? String(verifiedStatus.amount) : null);
        } catch (err: any) {
          console.error("Failed to finalize Paynow callback record (non-critical):", err);
        }
      }
      
      res.status(200).send("OK");
    } catch (err) {
      logPaymentEvent("PAYNOW_CALLBACK_ERROR", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      res.status(500).send("Error processing callback");
    }
  });
}
