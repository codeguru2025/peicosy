import type { Request } from "express";
import bcrypt from "bcrypt";
import { authStorage } from "../replit_integrations/auth/storage";

export interface AuthenticatedUser {
  id?: string;
  claims?: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  expires_at?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function getUserId(req: AuthenticatedRequest): string | undefined {
  return req.user?.claims?.sub || req.user?.id;
}

export async function canAccessOrder(req: AuthenticatedRequest, orderUserId: string): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) return false;
  if (orderUserId === userId) return true;
  const dbUser = await authStorage.getUser(userId);
  return dbUser?.isAdmin === true;
}

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function logPaymentEvent(event: string, data: Record<string, any>) {
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
