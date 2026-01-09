import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

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

      // Add dummy shipping/customs for now
      const shippingCost = input.shippingMethod === 'air' ? 50 : 20;
      const customsDuty = totalAmount * 0.45; // 45% duty
      totalAmount += shippingCost + customsDuty;

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


  // Helper to seed data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getProducts();
  if (existing.length === 0) {
    console.log("Seeding database...");
    const products = [
      {
        brand: "Gucci",
        name: "Marmont Matelassé Bag",
        description: "The small GG Marmont chain shoulder bag has a softly structured shape and an oversized flap closure with Double G hardware.",
        price: "1890.00",
        currency: "GBP",
        category: "Bags",
        imageUrl: "https://media.gucci.com/style/DarkGray_Center_0_0_800x800/1475575225/443497_DTD1T_1000_001_080_0000_Light-GG-Marmont-small-matelass-shoulder-bag.jpg", // Placeholder
        stock: 5
      },
      {
        brand: "Louis Vuitton",
        name: "Neverfull MM",
        description: "The Neverfull MM tote unites timeless design with heritage details. Elegant in Damier Ebene Canvas with natural cowhide trim.",
        price: "1450.00",
        currency: "GBP",
        category: "Bags",
        imageUrl: "https://eu.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-neverfull-mm-damier-ebene-canvas-handbags--N41358_PM2_Front%20view.png", // Placeholder
        stock: 3
      },
      {
        brand: "Balenciaga",
        name: "Triple S Sneakers",
        description: "Double foam and mesh. Complex 3-layered outsole. Embroidered size at the edge of the toe.",
        price: "850.00",
        currency: "GBP",
        category: "Shoes",
        imageUrl: "https://balenciaga.dam.kering.com/m/6c50785161099e0a/Medium-536737W2FS11000_F.jpg", // Placeholder
        stock: 10
      }
    ];

    for (const p of products) {
      await storage.createProduct(p);
    }
  }
}
