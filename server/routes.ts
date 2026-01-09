import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { generatePayFastForm, isPayFastConfigured, validatePayFastITN } from "./payfast";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup Object Storage
  registerObjectStorageRoutes(app);

  // 3. API Routes

  // --- Admin Login (username/password) ---
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      const hashedPassword = hashPassword(password);
      
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set up session manually
      (req as any).session.passport = {
        user: {
          id: user.id,
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            profile_image: user.profileImageUrl,
          },
        },
      };
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- Products ---
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts(
      req.query.category as string, 
      req.query.search as string
    );
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Admin only: Create Product
  app.post(api.products.create.path, isAuthenticated, async (req, res) => {
    try {
      // TODO: check admin role
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Admin only: Update Product
  app.put(api.products.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const updated = await storage.updateProduct(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Product not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- Orders ---
  app.get(api.orders.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    // If admin, return all? For now just user's orders
    const orders = await storage.getOrders(user.claims.sub);
    res.json(orders);
  });

  app.get(api.orders.get.path, isAuthenticated, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    // TODO: Check if user owns order or is admin
    res.json(order);
  });

  app.post(api.orders.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const input = api.orders.create.input.parse(req.body);
      
      // Calculate totals (Simplified for MVP)
      // In real app, fetch products and calc price server side
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

      // Calculate shipping and customs using database rates
      const subtotal = totalAmount;
      
      // Get shipping rate from database
      const rates = await storage.getShippingRates();
      const rate = rates.find(r => r.method === input.shippingMethod);
      const shippingCost = rate ? Number(rate.rate) : (input.shippingMethod === 'air' ? 50 : 20);
      
      // Get customs duty from database - use first item's category or 'general'
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

      const orderData = {
        userId: user.claims.sub,
        shippingMethod: input.shippingMethod,
        shippingAddress: input.shippingAddress,
        totalAmount: String(totalAmount),
        shippingCost: String(shippingCost),
        customsDuty: String(customsDuty),
        status: 'pending_payment',
        currency: 'GBP'
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
      const input = api.orders.updateStatus.input.parse(req.body);
      const updated = await storage.updateOrderStatus(
        Number(req.params.id), 
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

  // --- Admin ---
  app.get(api.admin.dashboard.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.admin.orders.path, isAuthenticated, async (req, res) => {
    // TODO: Check admin role
    const orders = await storage.getAllOrders();
    res.json(orders);
  });

  // --- Shipping & Landed Cost Calculator ---
  app.get(api.shipping.rates.path, async (req, res) => {
    const rates = await storage.getShippingRates();
    res.json(rates);
  });

  app.post(api.shipping.calculate.path, async (req, res) => {
    try {
      const input = api.shipping.calculate.input.parse(req.body);
      
      // Get shipping rates
      const rates = await storage.getShippingRates();
      const rate = rates.find(r => r.method === input.method);
      const shippingCost = rate ? Number(rate.rate) : (input.method === 'air' ? 50 : 20);
      
      // Get customs rules for South Africa
      const rules = await storage.getCustomsRules('ZA');
      let customsDuty = 0;
      
      if (rules.length > 0) {
        // Find matching category rule or use general rule
        const rule = rules.find(r => r.category === input.category) || rules.find(r => r.category === 'general');
        if (rule && input.subtotal > Number(rule.threshold || 0)) {
          customsDuty = input.subtotal * (Number(rule.dutyPercentage) / 100);
        }
      } else {
        // Default: 45% duty
        customsDuty = input.subtotal * 0.45;
      }
      
      const total = input.subtotal + shippingCost + customsDuty;
      
      // Get exchange rate for ZAR conversion
      const exchangeRateData = await storage.getExchangeRate('GBP', 'ZAR');
      const exchangeRate = exchangeRateData ? Number(exchangeRateData.rate) : 23.50;
      
      res.json({ 
        shippingCost, 
        customsDuty, 
        total,
        subtotalZAR: input.subtotal * exchangeRate,
        shippingCostZAR: shippingCost * exchangeRate,
        customsDutyZAR: customsDuty * exchangeRate,
        totalZAR: total * exchangeRate,
        exchangeRate
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  // --- Exchange Rate ---
  app.get(api.exchangeRate.get.path, async (req, res) => {
    try {
      const exchangeRate = await storage.getExchangeRate('GBP', 'ZAR');
      if (!exchangeRate) {
        return res.json({ rate: 23.50, fromCurrency: 'GBP', toCurrency: 'ZAR' });
      }
      res.json({
        rate: Number(exchangeRate.rate),
        fromCurrency: exchangeRate.fromCurrency,
        toCurrency: exchangeRate.toCurrency,
        updatedAt: exchangeRate.updatedAt?.toISOString(),
      });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.exchangeRate.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.exchangeRate.update.input.parse(req.body);
      const updated = await storage.updateExchangeRate('GBP', 'ZAR', input.rate);
      res.json({
        rate: Number(updated.rate),
        fromCurrency: updated.fromCurrency,
        toCurrency: updated.toCurrency,
        updatedAt: updated.updatedAt?.toISOString(),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- Product Delete ---
  app.delete(api.products.delete.path, isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- PayFast Payment ---
  
  // Check if PayFast is configured
  app.get("/api/payment/status", (req, res) => {
    res.json({ 
      payfast: isPayFastConfigured(),
      manual: true // Always allow manual bank transfer
    });
  });

  // Initiate PayFast payment for an order
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
      
      // Get exchange rate for ZAR amount
      const exchangeRateData = await storage.getExchangeRate('GBP', 'ZAR');
      const exchangeRate = exchangeRateData ? Number(exchangeRateData.rate) : 23.50;
      const amountZAR = Number(order.totalAmount) * exchangeRate;
      
      // Get user info
      const user = req.user as any;
      
      // Generate base URL
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

  // PayFast ITN (Instant Transaction Notification) - webhook callback
  app.post("/api/payment/payfast/notify", async (req, res) => {
    try {
      if (!isPayFastConfigured()) {
        return res.status(503).send("PayFast not configured");
      }
      
      console.log("PayFast ITN received:", req.body);
      
      const result = validatePayFastITN(req.body);
      
      if (!result.valid) {
        console.error("Invalid PayFast ITN signature");
        return res.status(400).send("Invalid signature");
      }
      
      // Update order status based on payment status
      if (result.paymentStatus === "COMPLETE") {
        await storage.updateOrderStatus(result.orderId, "confirmed");
        console.log(`Order ${result.orderId} confirmed via PayFast`);
      } else if (result.paymentStatus === "CANCELLED") {
        await storage.updateOrderStatus(result.orderId, "cancelled");
        console.log(`Order ${result.orderId} cancelled`);
      }
      
      // PayFast expects a 200 OK response
      res.status(200).send("OK");
    } catch (err) {
      console.error("PayFast ITN error:", err);
      res.status(500).send("Error processing notification");
    }
  });

  // Helper to seed data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Always seed shipping rates and customs rules
  await seedShippingData();
  
  const existing = await storage.getProducts();
  if (existing.length === 0) {
    console.log("Seeding database...");
    const productsData = [
      {
        brand: "Gucci",
        name: "Marmont Matelassé Bag",
        description: "The small GG Marmont chain shoulder bag has a softly structured shape and an oversized flap closure with Double G hardware.",
        price: "1890.00",
        currency: "GBP",
        category: "Bags",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop",
        stock: 5
      },
      {
        brand: "Louis Vuitton",
        name: "Neverfull MM",
        description: "The Neverfull MM tote unites timeless design with heritage details. Elegant in Damier Ebene Canvas with natural cowhide trim.",
        price: "1450.00",
        currency: "GBP",
        category: "Bags",
        imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop",
        stock: 3
      },
      {
        brand: "Balenciaga",
        name: "Triple S Sneakers",
        description: "Double foam and mesh. Complex 3-layered outsole. Embroidered size at the edge of the toe.",
        price: "850.00",
        currency: "GBP",
        category: "Shoes",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
        stock: 10
      },
      {
        brand: "Hermès",
        name: "Birkin 30",
        description: "The iconic Birkin bag in Togo leather with palladium hardware. Handcrafted by skilled artisans.",
        price: "8500.00",
        currency: "GBP",
        category: "Bags",
        imageUrl: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&auto=format&fit=crop",
        stock: 2
      },
      {
        brand: "Rolex",
        name: "Datejust 41",
        description: "The Oyster Perpetual Datejust is the archetype of the classic watch. Oystersteel with Jubilee bracelet.",
        price: "9800.00",
        currency: "GBP",
        category: "Watches",
        imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&auto=format&fit=crop",
        stock: 4
      },
      {
        brand: "Cartier",
        name: "Love Bracelet",
        description: "The iconic Love bracelet in 18K yellow gold. Timeless elegance with signature screw motifs.",
        price: "6750.00",
        currency: "GBP",
        category: "Jewelry",
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop",
        stock: 6
      }
    ];

    for (const p of productsData) {
      await storage.createProduct(p);
    }

    console.log("Database seeded successfully!");
  }
}

async function seedShippingData() {
  try {
    const { db } = await import("./db");
    const { shippingRates, customsRules, exchangeRates } = await import("@shared/schema");
    
    // Check if shipping rates exist
    const existingRates = await storage.getShippingRates();
    if (existingRates.length === 0) {
      console.log("Seeding shipping rates...");
      await db.insert(shippingRates).values([
        { method: "air", minWeight: "0", maxWeight: "30", rate: "50.00", currency: "GBP" },
        { method: "sea", minWeight: "0", maxWeight: "100", rate: "20.00", currency: "GBP" },
      ]);
    }
    
    // Check if customs rules exist
    const existingRules = await storage.getCustomsRules("ZA");
    if (existingRules.length === 0) {
      console.log("Seeding customs rules...");
      await db.insert(customsRules).values([
        { countryCode: "ZA", category: "general", dutyPercentage: "45.00", threshold: "0", currency: "ZAR" },
        { countryCode: "ZA", category: "Bags", dutyPercentage: "40.00", threshold: "0", currency: "ZAR" },
        { countryCode: "ZA", category: "Shoes", dutyPercentage: "30.00", threshold: "0", currency: "ZAR" },
        { countryCode: "ZA", category: "Watches", dutyPercentage: "20.00", threshold: "0", currency: "ZAR" },
        { countryCode: "ZA", category: "Jewelry", dutyPercentage: "25.00", threshold: "0", currency: "ZAR" },
      ]);
    }
    
    // Check if exchange rate exists
    const existingRate = await storage.getExchangeRate("GBP", "ZAR");
    if (!existingRate) {
      console.log("Seeding exchange rate...");
      // Default GBP to ZAR rate (approximately 23.50 as of 2026)
      await db.insert(exchangeRates).values([
        { fromCurrency: "GBP", toCurrency: "ZAR", rate: "23.50" },
      ]);
    }
  } catch (err) {
    console.error("Error seeding shipping data:", err);
  }
}
