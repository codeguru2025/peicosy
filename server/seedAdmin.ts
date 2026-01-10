import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function seedAdminUser() {
  // Use environment variables for admin credentials, with defaults for initial setup only
  const adminUsername = process.env.ADMIN_USERNAME || "peicosy";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  // Warn if using default credentials
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.warn("WARNING: Using default admin credentials. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables for production.");
  }
  
  const existingAdmin = await db.select().from(users).where(eq(users.username, adminUsername));
  
  const bcryptHash = await hashPassword(adminPassword);
  
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: adminUsername,
      password: bcryptHash,
      firstName: "Admin",
      lastName: "User",
      email: "admin@peicosy.com",
      isAdmin: true,
    });
    console.log("Default admin user created: peicosy");
  } else {
    const currentPassword = existingAdmin[0].password || "";
    const isBcryptHash = currentPassword.startsWith("$2b$") || currentPassword.startsWith("$2a$");
    
    if (!isBcryptHash) {
      await db.update(users).set({ password: bcryptHash }).where(eq(users.username, adminUsername));
      console.log("Admin password upgraded to bcrypt: peicosy");
    }
    
    if (!existingAdmin[0].isAdmin) {
      await db.update(users).set({ isAdmin: true }).where(eq(users.username, adminUsername));
      console.log("Existing user promoted to admin: peicosy");
    } else {
      console.log("Admin user already exists: peicosy");
    }
  }
}
