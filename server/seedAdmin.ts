import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function seedAdminUser() {
  const isProduction = process.env.NODE_ENV === "production";
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // In production, REQUIRE admin credentials to be set
  if (isProduction && (!adminUsername || !adminPassword)) {
    throw new Error(
      "SECURITY ERROR: ADMIN_USERNAME and ADMIN_PASSWORD environment variables MUST be set in production. " +
      "Default credentials are not allowed in production environments."
    );
  }
  
  // Use defaults only in development with warning
  const finalUsername = adminUsername || "peicosy";
  const finalPassword = adminPassword || "admin123";
  
  if (!adminUsername || !adminPassword) {
    console.warn(
      "⚠️  WARNING: Using default admin credentials (peicosy/admin123). " +
      "Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables before deploying to production."
    );
  }
  
  const existingAdmin = await db.select().from(users).where(eq(users.username, finalUsername));
  
  const bcryptHash = await hashPassword(finalPassword);
  
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: finalUsername,
      password: bcryptHash,
      firstName: "Admin",
      lastName: "User",
      email: "admin@peicosy.com",
      isAdmin: true,
    });
    console.log(`Admin user created: ${finalUsername}`);
  } else {
    const currentPassword = existingAdmin[0].password || "";
    const isBcryptHash = currentPassword.startsWith("$2b$") || currentPassword.startsWith("$2a$");
    
    if (!isBcryptHash) {
      await db.update(users).set({ password: bcryptHash }).where(eq(users.username, finalUsername));
      console.log(`Admin password upgraded to bcrypt: ${finalUsername}`);
    }
    
    if (!existingAdmin[0].isAdmin) {
      await db.update(users).set({ isAdmin: true }).where(eq(users.username, finalUsername));
      console.log(`Existing user promoted to admin: ${finalUsername}`);
    } else {
      console.log(`Admin user already exists: ${finalUsername}`);
    }
  }
}
