import type { Express, Request, Response } from "express";
import { TOTP, generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./utils";

const APP_NAME = "Peicosy";

function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated?.() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Please sign in first." });
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
}

function createOtpAuthUrl(secret: string, account: string, issuer: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

async function verifyTotp(token: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({ token, secret });
    if (result && typeof result === 'object' && 'valid' in result) {
      return result.valid === true;
    }
    return false;
  } catch {
    return false;
  }
}

export function registerTwoFactorRoutes(app: Express) {
  app.post("/api/auth/2fa/setup", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found." });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (user.twoFactorEnabled) {
        return res.status(400).json({ message: "Two-factor authentication is already enabled." });
      }

      const secret = generateSecret();
      const username = user.username || user.email || userId;
      const otpauthUrl = createOtpAuthUrl(secret, username, APP_NAME);

      await db
        .update(users)
        .set({ twoFactorSecret: secret })
        .where(eq(users.id, userId));

      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      res.json({
        secret,
        qrCode: qrCodeDataUrl,
        message: "Scan the QR code with your authenticator app, then verify with a code.",
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to set up two-factor authentication." });
    }
  });

  app.post("/api/auth/2fa/verify-setup", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { code } = req.body;

      if (!code || code.length !== 6) {
        return res.status(400).json({ message: "Please enter a valid 6-digit code." });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ message: "Please start the 2FA setup process first." });
      }

      const isValid = await verifyTotp(code, user.twoFactorSecret);

      if (!isValid) {
        return res.status(400).json({ message: "Invalid code. Please try again." });
      }

      const backupCodes = generateBackupCodes(10);
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(async (c) => await hashPassword(c))
      );

      await db
        .update(users)
        .set({
          twoFactorEnabled: true,
          twoFactorBackupCodes: hashedBackupCodes,
        })
        .where(eq(users.id, userId));

      res.json({
        message: "Two-factor authentication is now enabled.",
        backupCodes,
        warning: "Save these backup codes in a safe place. You won't be able to see them again.",
      });
    } catch (error) {
      console.error("2FA verify-setup error:", error);
      res.status(500).json({ message: "Failed to complete 2FA setup." });
    }
  });

  app.post("/api/auth/2fa/disable", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { code } = req.body;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.twoFactorEnabled) {
        return res.status(400).json({ message: "Two-factor authentication is not enabled." });
      }

      const isValid = user.twoFactorSecret ? await verifyTotp(code, user.twoFactorSecret) : false;

      if (!isValid) {
        return res.status(400).json({ message: "Invalid code. Please try again." });
      }

      await db
        .update(users)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
        })
        .where(eq(users.id, userId));

      res.json({ message: "Two-factor authentication has been disabled." });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Failed to disable 2FA." });
    }
  });

  app.get("/api/auth/2fa/status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      res.json({
        enabled: user?.twoFactorEnabled || false,
      });
    } catch (error) {
      console.error("2FA status error:", error);
      res.status(500).json({ message: "Failed to get 2FA status." });
    }
  });
}

export async function verifyTwoFactorCode(secret: string, code: string): Promise<boolean> {
  return await verifyTotp(code, secret);
}
