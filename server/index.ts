import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seedAdminUser } from "./seedAdmin";
import path from "path";
import helmet from "helmet";

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      frameSrc: ["'self'", "https://www.payfast.co.za", "https://sandbox.payfast.co.za"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// Serve attached assets (product images)
app.use('/assets', express.static(path.join(process.cwd(), 'attached_assets')));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  
  // Seed default admin user
  try {
    await seedAdminUser();
  } catch (err) {
    console.error("Failed to seed admin user:", err);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Handle CSRF errors gracefully
    if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
      return res.status(403).json({ message: "Session expired. Please refresh and try again." });
    }
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    
    // Only log server errors, not client errors
    if (status >= 500) {
      console.error("Server error:", err);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // Start background job processor
  const { startJobProcessor, stopJobProcessor } = await import("./workers/jobProcessor");
  startJobProcessor(60000); // Process jobs every 60 seconds

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    log(`${signal} received. Starting graceful shutdown...`);
    
    // Stop job processor
    stopJobProcessor();
    log("Job processor stopped");
    
    // First, stop accepting new connections and wait for existing to finish
    await new Promise<void>((resolve) => {
      httpServer.close((err) => {
        if (err) {
          console.error("Error closing HTTP server:", err);
        } else {
          log("HTTP server closed");
        }
        resolve();
      });
    });

    // Then close database pool
    try {
      const { pool } = await import("./db");
      await pool.end();
      log("Database pool closed");
    } catch (err) {
      console.error("Error closing database pool:", err);
    }

    log("Graceful shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
})();
