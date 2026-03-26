import type { Request } from "express";
import bcrypt from "bcrypt";
import { authStorage } from "../auth/storage";

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

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

function sanitizePII(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  if (sanitized.phone && typeof sanitized.phone === "string") {
    sanitized.phone = sanitized.phone.slice(0, 4) + "****" + sanitized.phone.slice(-2);
  }
  if (sanitized.email && typeof sanitized.email === "string") {
    const parts = sanitized.email.split("@");
    if (parts.length === 2) {
      sanitized.email = parts[0].slice(0, 2) + "***@" + parts[1];
    }
  }
  if (sanitized.password) {
    sanitized.password = "[REDACTED]";
  }
  return sanitized;
}

function formatLog(level: LogLevel, category: string, message: string, context: LogContext = {}) {
  return JSON.stringify({
    level,
    category,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizePII(context),
  });
}

export const logger = {
  debug(category: string, message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.log(formatLog("debug", category, message, context));
    }
  },
  info(category: string, message: string, context?: LogContext) {
    console.log(formatLog("info", category, message, context));
  },
  warn(category: string, message: string, context?: LogContext) {
    console.warn(formatLog("warn", category, message, context));
  },
  error(category: string, message: string, context?: LogContext & { error?: Error }) {
    const ctx = { ...context };
    if (ctx.error instanceof Error) {
      ctx.errorMessage = ctx.error.message;
      ctx.errorStack = ctx.error.stack;
      delete ctx.error;
    }
    console.error(formatLog("error", category, message, ctx));
  },
};

export function logPaymentEvent(event: string, data: Record<string, any>) {
  logger.info("PAYMENT", event, data);
}

export function handleRouteError(
  res: any,
  error: unknown,
  context: { operation: string; userId?: string }
) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error("API", `${context.operation} failed`, {
    ...context,
    error: error instanceof Error ? error : undefined,
  });
  res.status(500).json({ message: "Something went wrong. Please try again." });
}
