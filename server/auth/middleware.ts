import type { RequestHandler } from "express";
import { authStorage } from "./storage";

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check session expiry
  const now = Math.floor(Date.now() / 1000);
  if (user.expires_at && now > user.expires_at) {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  return next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = user.claims?.sub || user.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await authStorage.getUser(userId);
    if (!dbUser?.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    return next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};
