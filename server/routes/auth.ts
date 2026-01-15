import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { hashPassword, verifyPassword } from "./utils";
import { LOCKOUT_CONFIG } from "@shared/schema";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function registerAuthApiRoutes(app: Express) {
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
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "This username is already taken. Please choose another." });
      }
      
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
      
      const sessionExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
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
      
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
          console.error("Session regeneration error:", regenerateErr);
          return res.status(500).json({ message: "We couldn't complete your registration. Please try again." });
        }
        
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
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
  });

  app.post("/api/auth/login", strictAuthLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Please enter your username and password." });
      }
      
      // Check if account is locked
      const lockStatus = await storage.isAccountLocked(username);
      if (lockStatus.locked) {
        return res.status(423).json({ 
          message: `Your account is temporarily locked due to too many failed login attempts. Please try again in ${lockStatus.remainingMinutes} minute${lockStatus.remainingMinutes !== 1 ? 's' : ''}.`,
          locked: true,
          remainingMinutes: lockStatus.remainingMinutes,
        });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.password) {
        await storage.recordLoginAttempt(username, false, ipAddress);
        const failedAttempts = await storage.getRecentFailedAttempts(username);
        const attemptsRemaining = Math.max(0, LOCKOUT_CONFIG.MAX_ATTEMPTS - failedAttempts);
        
        return res.status(401).json({ 
          message: "The username or password you entered doesn't match our records.",
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : undefined,
        });
      }
      
      const passwordValid = await verifyPassword(password, user.password);
      
      if (!passwordValid) {
        await storage.recordLoginAttempt(username, false, ipAddress);
        const failedAttempts = await storage.getRecentFailedAttempts(username);
        const attemptsRemaining = Math.max(0, LOCKOUT_CONFIG.MAX_ATTEMPTS - failedAttempts);
        
        if (attemptsRemaining === 0) {
          return res.status(423).json({
            message: `Your account has been locked due to too many failed login attempts. Please try again in ${LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES} minutes.`,
            locked: true,
            remainingMinutes: LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES,
          });
        }
        
        return res.status(401).json({ 
          message: "The username or password you entered doesn't match our records.",
          attemptsRemaining,
        });
      }
      
      // Successful login - record it and clear failed attempts
      await storage.recordLoginAttempt(username, true, ipAddress);
      await storage.clearLoginAttempts(username);
      
      const sessionExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
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
      
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
          console.error("Session regeneration error:", regenerateErr);
          return res.status(500).json({ message: "We couldn't sign you in. Please try again." });
        }
        
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
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
}
