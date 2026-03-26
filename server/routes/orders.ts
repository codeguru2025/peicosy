import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { OrderStatus } from "@shared/schema";
import { isAuthenticated, isAdmin } from "../auth";
import { canAccessOrder, AuthenticatedRequest } from "./utils";

export function registerOrderRoutes(app: Express) {
  app.get(api.orders.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const orders = await storage.getOrders(user.claims.sub);
    res.json(orders);
  });

  app.get(api.orders.get.path, isAuthenticated, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    const hasAccess = await canAccessOrder(req as AuthenticatedRequest, order.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have permission to view this order." });
    }
    
    res.json(order);
  });

  app.post(api.orders.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const input = api.orders.create.input.parse(req.body);
      
      let totalAmount = 0;
      const orderItems = [];

      for (const item of input.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        
        const price = Number(product.price);
        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: String(price),
        });
      }

      const subtotal = totalAmount;
      
      const rates = await storage.getShippingRates();
      const rate = rates.find(r => r.method === input.shippingMethod);
      const shippingCost = rate ? Number(rate.rate) : (input.shippingMethod === 'air' ? 50 : 20);
      
      const firstProduct = orderItems.length > 0 ? await storage.getProduct(orderItems[0].productId) : null;
      const category = firstProduct?.category || 'general';
      
      const rules = await storage.getCustomsRules('ZA');
      let customsDuty = 0;
      
      if (rules.length > 0) {
        const rule = rules.find(r => r.category?.toLowerCase() === category.toLowerCase()) || rules.find(r => r.category === 'general');
        if (rule && subtotal > Number(rule.threshold || 0)) {
          customsDuty = subtotal * (Number(rule.dutyPercentage) / 100);
        }
      } else {
        customsDuty = subtotal * 0.45;
      }
      
      totalAmount = subtotal + shippingCost + customsDuty;

      const zarRateData = await storage.getExchangeRate('GBP', 'ZAR');
      const usdRateData = await storage.getExchangeRate('GBP', 'USD');
      const zarRate = zarRateData ? Number(zarRateData.rate) : 23.50;
      const usdRate = usdRateData ? Number(usdRateData.rate) : 1.27;
      
      const expectedAmountZar = totalAmount * zarRate;
      const expectedAmountUsd = totalAmount * usdRate;

      const orderData = {
        userId: user.claims.sub,
        shippingMethod: input.shippingMethod,
        shippingAddress: input.shippingAddress,
        totalAmount: String(totalAmount),
        shippingCost: String(shippingCost),
        customsDuty: String(customsDuty),
        status: OrderStatus.PENDING_PAYMENT,
        currency: 'GBP',
        expectedAmountUsd: String(expectedAmountUsd),
        expectedAmountZar: String(expectedAmountZar),
      };

      const order = await storage.createOrder(orderData, orderItems);
      res.status(201).json(order);

    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.orders.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      
      const hasAccess = await canAccessOrder(req as AuthenticatedRequest, order.userId);
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have permission to update this order." });
      }
      
      const input = api.orders.updateStatus.input.parse(req.body);
      const updated = await storage.updateOrderStatus(
        orderId, 
        input.status, 
        input.proofOfPaymentUrl
      );
      if (!updated) return res.status(404).json({ message: "Order not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
}
