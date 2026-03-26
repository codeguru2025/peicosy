import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { csrfSync } from "csrf-sync";
import { registerAuthRoutes, setupAuth, isAuthenticated, isAdmin } from "./auth";
import { registerObjectStorageRoutes } from "./objectStorage";
import {
  registerAuthApiRoutes,
  registerProductRoutes,
  registerOrderRoutes,
  registerAdminRoutes,
  registerShippingRoutes,
  registerPaymentRoutes,
  registerTwoFactorRoutes,
} from "./routes/index";

const {
  generateToken,
  csrfSynchronisedProtection,
} = csrfSync({
  getTokenFromRequest: (req) => req.headers["x-csrf-token"] as string,
});

const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Payment webhooks skip CSRF (they have their own security)
  const skipPaths = [
    "/api/payment/payfast/notify",
    "/api/payments/paynow/callback",
  ];
  
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  // Read-only methods don't need CSRF protection
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  
  return csrfSynchronisedProtection(req, res, next);
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app, isAuthenticated);

  app.use(csrfProtection);

  app.get("/api/csrf-token", (req, res) => {
    const token = generateToken(req);
    res.json({ csrfToken: token });
  });

  app.get("/api/health", async (req, res) => {
    try {
      const { pool } = await import("./db");
      await pool.query("SELECT 1");
      const response: Record<string, any> = { 
        status: "healthy", 
        timestamp: new Date().toISOString(),
      };
      // Only expose diagnostics outside production
      if (process.env.NODE_ENV !== "production") {
        response.uptime = process.uptime();
        response.memory = process.memoryUsage();
      }
      res.json(response);
    } catch (err) {
      res.status(503).json({ 
        status: "unhealthy", 
        timestamp: new Date().toISOString(),
      });
    }
  });

  registerAuthApiRoutes(app);
  registerTwoFactorRoutes(app);
  registerProductRoutes(app);
  registerOrderRoutes(app);
  registerAdminRoutes(app);
  registerShippingRoutes(app);
  registerPaymentRoutes(app);

  // Only seed database in development or if explicitly enabled
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SEEDING === "true") {
    await seedDatabase();
  }

  return httpServer;
}

async function seedDatabase() {
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
    
    const existingRates = await storage.getShippingRates();
    if (existingRates.length === 0) {
      console.log("Seeding shipping rates...");
      await db.insert(shippingRates).values([
        { method: "air", minWeight: "0", maxWeight: "30", rate: "50.00", currency: "GBP" },
        { method: "sea", minWeight: "0", maxWeight: "100", rate: "20.00", currency: "GBP" },
      ]);
    }
    
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
    
    const existingZarRate = await storage.getExchangeRate("GBP", "ZAR");
    if (!existingZarRate) {
      console.log("Seeding GBP/ZAR exchange rate...");
      await db.insert(exchangeRates).values([
        { fromCurrency: "GBP", toCurrency: "ZAR", rate: "23.50" },
      ]);
    }
    
    const existingUsdRate = await storage.getExchangeRate("GBP", "USD");
    if (!existingUsdRate) {
      console.log("Seeding GBP/USD exchange rate...");
      await db.insert(exchangeRates).values([
        { fromCurrency: "GBP", toCurrency: "USD", rate: "1.27" },
      ]);
    }
  } catch (err) {
    console.error("Error seeding shipping data:", err);
  }
}
