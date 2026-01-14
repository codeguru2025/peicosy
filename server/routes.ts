import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated, isAdmin } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { generatePayFastForm, isPayFastConfigured, validatePayFastITN } from "./payfast";
import { isPaynowConfigured, initiateWebPayment, initiateMobilePayment, checkPaymentStatus, validatePaynowHash } from "./paynow";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { 
  loginSchema, 
  registerSchema, 
  createOrderSchema, 
  calculateShippingSchema,
  paynowInitiateSchema,
  paynowMobileSchema,
  OrderStatus 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { authStorage } from "./replit_integrations/auth/storage";

interface AuthenticatedUser {
  id?: string;
  claims?: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  expires_at?: number;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function getUserId(req: AuthenticatedRequest): string | undefined {
  return req.user?.claims?.sub || req.user?.id;
}

async function canAccessOrder(req: AuthenticatedRequest, orderUserId: string): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) return false;
  if (orderUserId === userId) return true;
  const dbUser = await authStorage.getUser(userId);
  return dbUser?.isAdmin === true;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many failed attempts. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

function logPaymentEvent(event: string, data: Record<string, any>) {
  const sanitizedData = { ...data };
  if (sanitizedData.phone) {
    sanitizedData.phone = sanitizedData.phone.slice(0, 4) + "****" + sanitizedData.phone.slice(-2);
  }
  if (sanitizedData.email) {
    const [local, domain] = sanitizedData.email.split("@");
    sanitizedData.email = local.slice(0, 2) + "***@" + domain;
  }
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    type: "PAYMENT_EVENT",
    event,
    timestamp,
    ...sanitizedData,
  }));
}

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup Object Storage (with authentication for uploads)
  registerObjectStorageRoutes(app, isAuthenticated);

  // 3. API Routes

  // --- Health Check ---
  app.get("/api/health", async (req, res) => {
    try {
      const { pool } = await import("./db");
      await pool.query("SELECT 1");
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    } catch (err) {
      res.status(503).json({ 
        status: "unhealthy", 
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // --- User Registration ---
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const { username, password, email, firstName, lastName } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Please enter a username and password." });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ message: "Your username needs to be at least 3 characters." });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: "Please choose a password with at least 8 characters." });
      }
      
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one uppercase letter." });
      }
      
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one lowercase letter." });
      }
      
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one number." });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "This username is already taken. Please choose another." });
      }
      
      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ message: "This email is already registered. Please sign in instead." });
        }
      }
      
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        isAdmin: false,
      });
      
      // Create session user object compatible with Passport and isAuthenticated
      const sessionExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 1 week
      const sessionUser = {
        id: user.id,
        expires_at: sessionExpiry,
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image: user.profileImageUrl,
        },
      };
      
      // Use Passport's login method for proper session handling
      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "We couldn't complete your registration. Please try again." });
        }
        
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
        });
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
  });

  // --- User Login (username/password) ---
  app.post("/api/auth/login", strictAuthLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Please enter your username and password." });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.password) {
        return res.status(401).json({ message: "The username or password you entered doesn't match our records." });
      }
      
      const passwordValid = await verifyPassword(password, user.password);
      
      if (!passwordValid) {
        return res.status(401).json({ message: "The username or password you entered doesn't match our records." });
      }
      
      // Create session user object compatible with Passport and isAuthenticated
      const sessionExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 1 week
      const sessionUser = {
        id: user.id,
        expires_at: sessionExpiry,
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image: user.profileImageUrl,
        },
      };
      
      // Use Passport's login method for proper session handling
      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "We couldn't sign you in. Please try again." });
        }
        
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        });
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
  app.post(api.products.create.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
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
  app.put(api.products.update.path, isAuthenticated, isAdmin, async (req, res) => {
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

  // --- Product Images ---
  // Get images for a product
  app.get("/api/products/:productId/images", async (req, res) => {
    try {
      const images = await storage.getProductImages(Number(req.params.productId));
      res.json(images);
    } catch (err) {
      console.error("Error fetching product images:", err);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get product with all images
  app.get("/api/products/:productId/with-images", async (req, res) => {
    try {
      const product = await storage.getProductWithImages(Number(req.params.productId));
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      console.error("Error fetching product with images:", err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Admin: Add image to product
  app.post("/api/products/:productId/images", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const { objectPath, cdnUrl, role, originalFilename, mimeType, fileSize, width, height } = req.body;
      
      if (!objectPath || !cdnUrl || !mimeType) {
        return res.status(400).json({ message: "Missing required fields: objectPath, cdnUrl, mimeType" });
      }

      const image = await storage.addProductImage({
        productId,
        objectPath,
        cdnUrl,
        role: role || 'gallery',
        originalFilename,
        mimeType,
        fileSize,
        width,
        height,
        sortOrder: 0,
        isLegacy: false,
      });

      res.status(201).json(image);
    } catch (err) {
      console.error("Error adding product image:", err);
      res.status(500).json({ message: "Failed to add image" });
    }
  });

  // Admin: Update image metadata
  app.patch("/api/product-images/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role, sortOrder } = req.body;
      const updated = await storage.updateProductImage(Number(req.params.id), { role, sortOrder });
      if (!updated) return res.status(404).json({ message: "Image not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating product image:", err);
      res.status(500).json({ message: "Failed to update image" });
    }
  });

  // Admin: Delete image
  app.delete("/api/product-images/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteProductImage(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting product image:", err);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Admin: Reorder images for a product
  app.post("/api/products/:productId/images/reorder", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const { imageIds } = req.body;
      
      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ message: "imageIds must be an array" });
      }
      
      await storage.reorderProductImages(productId, imageIds);
      res.json({ success: true });
    } catch (err) {
      console.error("Error reordering images:", err);
      res.status(500).json({ message: "Failed to reorder images" });
    }
  });

  // Admin: Migrate legacy imageUrl to product_images table
  app.post("/api/products/:productId/migrate-image", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const image = await storage.migrateProductImageUrl(productId);
      if (!image) return res.status(404).json({ message: "No image to migrate" });
      res.json(image);
    } catch (err) {
      console.error("Error migrating product image:", err);
      res.status(500).json({ message: "Failed to migrate image" });
    }
  });

  // Admin: Bulk migrate all product images
  app.post("/api/admin/migrate-all-images", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const migrated = [];
      
      for (const product of products) {
        if (product.imageUrl) {
          const image = await storage.migrateProductImageUrl(product.id);
          if (image) migrated.push({ productId: product.id, imageId: image.id });
        }
      }
      
      res.json({ migrated, count: migrated.length });
    } catch (err) {
      console.error("Error migrating all images:", err);
      res.status(500).json({ message: "Failed to migrate images" });
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

  // --- Admin ---
  app.get(api.admin.dashboard.path, isAuthenticated, isAdmin, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.admin.orders.path, isAuthenticated, isAdmin, async (req, res) => {
    const orders = await storage.getAllOrders();
    res.json(orders);
  });

  // --- Admin Analytics ---
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ message: "Failed to load analytics" });
    }
  });

  // --- Admin Export ---
  app.get("/api/admin/export/:entity", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const entity = req.params.entity as 'products' | 'orders' | 'users' | 'transactions';
      const format = (req.query.format as string) || 'json';
      
      if (!['products', 'orders', 'users', 'transactions'].includes(entity)) {
        return res.status(400).json({ message: "Invalid entity type" });
      }
      
      const data = await storage.getExportData(entity);
      const filename = `${entity}-export-${new Date().toISOString().slice(0,10)}`;
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        
        if (data.length === 0) {
          return res.send('No data available\n');
        }
        
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(h => {
              const value = row[h];
              if (value === null || value === undefined) return '';
              const stringValue = String(value);
              if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            }).join(',')
          )
        ];
        
        return res.send(csvRows.join('\n'));
      }
      
      // JSON format
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Export error:", err);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // --- Inquiries ---
  // Public: Submit an inquiry
  app.post("/api/inquiries", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Please fill in all required fields." });
      }
      
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      
      const inquiry = await storage.createInquiry({ name, email, phone, subject, message });
      res.status(201).json({ message: "Inquiry submitted successfully", id: inquiry.id });
    } catch (err) {
      console.error("Error creating inquiry:", err);
      res.status(500).json({ message: "We couldn't send your inquiry. Please try again." });
    }
  });

  // Admin: Get all inquiries
  app.get("/api/admin/inquiries", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Admin: Update inquiry status
  app.patch("/api/admin/inquiries/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      
      if (!['new', 'read', 'replied', 'closed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updated = await storage.updateInquiryStatus(id, status);
      if (!updated) return res.status(404).json({ message: "Inquiry not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating inquiry:", err);
      res.status(500).json({ message: "Failed to update inquiry" });
    }
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

  app.put(api.exchangeRate.update.path, isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete(api.products.delete.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- Payment Methods ---
  
  // Check which payment methods are configured
  app.get("/api/payment/status", (req, res) => {
    res.json({ 
      payfast: isPayFastConfigured(),
      paynow: isPaynowConfigured(),
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
      
      logPaymentEvent("PAYFAST_ITN_RECEIVED", {
        orderId: req.body.m_payment_id,
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
      
      const order = await storage.getOrder(result.orderId);
      if (!order) {
        logPaymentEvent("PAYFAST_ITN_REJECTED", {
          reason: "ORDER_NOT_FOUND",
          orderId: result.orderId,
        });
        return res.status(404).send("Order not found");
      }
      
      if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.COMPLETED) {
        logPaymentEvent("PAYFAST_ITN_DUPLICATE", {
          orderId: result.orderId,
          currentStatus: order.status,
        });
        return res.status(200).send("Already processed");
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
      
      if (result.paymentStatus === "COMPLETE") {
        await storage.updateOrderStatus(result.orderId, OrderStatus.CONFIRMED);
        logPaymentEvent("PAYFAST_PAYMENT_CONFIRMED", {
          orderId: result.orderId,
          amount: result.amount,
        });
      } else if (result.paymentStatus === "CANCELLED") {
        await storage.updateOrderStatus(result.orderId, OrderStatus.CANCELLED);
        logPaymentEvent("PAYFAST_PAYMENT_CANCELLED", {
          orderId: result.orderId,
        });
      }
      
      res.status(200).send("OK");
    } catch (err) {
      logPaymentEvent("PAYFAST_ITN_ERROR", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      res.status(500).send("Error processing notification");
    }
  });

  // --- Paynow Payment (Zimbabwe) ---

  // Initiate Paynow web checkout
  app.post("/api/payment/paynow/initiate", isAuthenticated, async (req, res) => {
    try {
      // Validate request body with Zod
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

      // Authorization: verify order belongs to current user
      if (order.userId !== user.claims?.sub && order.userId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this order." });
      }

      // Get the order with items for itemized breakdown
      const orderWithItems = await storage.getOrderWithItems(orderId);
      
      // Get exchange rate for USD amount (Paynow uses USD)
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
        // Store the poll URL for status checking
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

  // Initiate Paynow mobile payment (Ecocash/OneMoney)
  app.post("/api/payment/paynow/mobile", isAuthenticated, async (req, res) => {
    try {
      // Validate request body with Zod
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

      // Authorization: verify order belongs to current user
      if (order.userId !== user.claims?.sub && order.userId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this order." });
      }

      const orderWithItems = await storage.getOrderWithItems(orderId);
      
      // Get exchange rate for USD amount
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

  // Check Paynow payment status
  app.get("/api/payment/paynow/status/:orderId", isAuthenticated, async (req, res) => {
    try {
      const orderId = Number(req.params.orderId);
      const user = req.user as any;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Authorization: verify order belongs to current user
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
        // Update order status if payment is confirmed
        if (order.status === OrderStatus.PENDING_PAYMENT) {
          await storage.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
        }
        
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

  // Paynow callback (server-to-server notification)
  app.post("/api/payments/paynow/callback", async (req, res) => {
    try {
      logPaymentEvent("PAYNOW_CALLBACK_RECEIVED", {
        reference: req.body.reference,
        paynowReference: req.body.paynowreference,
        status: req.body.status,
        amount: req.body.amount,
      });
      
      // SECURITY: Validate Paynow hash signature first
      if (!validatePaynowHash(req.body)) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "INVALID_HASH",
          reference: req.body.reference,
        });
        return res.status(401).send("Invalid signature");
      }
      
      // Paynow sends status updates to this URL
      const { reference, paynowreference, status, amount, pollurl } = req.body;
      
      // Extract order ID from reference (format: PEICOSY-{orderId}-{timestamp})
      const match = reference?.match(/PEICOSY-(\d+)-/);
      const orderId = match ? parseInt(match[1]) : null;
      
      if (!orderId) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "INVALID_REFERENCE_FORMAT",
          reference,
        });
        return res.status(400).send("Invalid reference");
      }

      // Verify order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "ORDER_NOT_FOUND",
          orderId,
          reference,
        });
        return res.status(404).send("Order not found");
      }

      // Verify we have a stored poll URL for this order (prevents unsolicited callbacks)
      const storedPollUrl = await storage.getOrderPaynowPollUrl(orderId);
      if (!storedPollUrl) {
        logPaymentEvent("PAYNOW_CALLBACK_REJECTED", {
          reason: "NO_STORED_POLL_URL",
          orderId,
          reference,
        });
        return res.status(400).send("No pending Paynow payment for this order");
      }

      // Check for duplicate processing
      if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.COMPLETED) {
        logPaymentEvent("PAYNOW_CALLBACK_DUPLICATE", {
          orderId,
          currentStatus: order.status,
          reference,
        });
        return res.status(200).send("Already processed");
      }

      // CRITICAL: Re-poll Paynow using our stored poll URL to verify the payment status
      const verifiedStatus = await checkPaymentStatus(storedPollUrl);
      
      // Verify payment amount matches expected (use locked-in amount from order creation)
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

      // Only update order if verified status from Paynow confirms payment
      if (verifiedStatus.paid) {
        if (order.status === OrderStatus.PENDING_PAYMENT) {
          await storage.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
          logPaymentEvent("PAYNOW_PAYMENT_CONFIRMED", {
            orderId,
            reference,
            paynowReference: paynowreference,
            amount: verifiedStatus.amount,
            previousStatus: order.status,
            newStatus: OrderStatus.CONFIRMED,
          });
        }
      } else if (verifiedStatus.status === 'Cancelled') {
        await storage.updateOrderStatus(orderId, OrderStatus.CANCELLED);
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
      
      res.status(200).send("OK");
    } catch (err) {
      logPaymentEvent("PAYNOW_CALLBACK_ERROR", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      res.status(500).send("Error processing callback");
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
