import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { RATE_LIMIT_CONFIG } from "@shared/schema";

type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

export function createDistributedRateLimiter(type: RateLimitType) {
  const config = RATE_LIMIT_CONFIG[type];
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || req.socket.remoteAddress || "unknown";
      const key = `${config.keyPrefix}:${identifier}`;
      
      const result = await storage.checkRateLimit(
        key,
        config.maxRequests,
        config.windowMinutes
      );
      
      res.setHeader("X-RateLimit-Limit", config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", Math.floor(result.resetAt.getTime() / 1000));
      
      if (!result.allowed) {
        const retryAfterSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
        res.setHeader("Retry-After", retryAfterSeconds);
        
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
          retryAfter: retryAfterSeconds,
        });
      }
      
      next();
    } catch (error) {
      console.error("Rate limiter error:", error);
      next();
    }
  };
}

export const distributedAuthLoginLimiter = createDistributedRateLimiter("AUTH_LOGIN");
export const distributedAuthRegisterLimiter = createDistributedRateLimiter("AUTH_REGISTER");
export const distributedApiDefaultLimiter = createDistributedRateLimiter("API_DEFAULT");
export const distributedApiSensitiveLimiter = createDistributedRateLimiter("API_SENSITIVE");
