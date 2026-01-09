import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function seedAdminUser() {
  const adminUsername = "peicosy";
  const adminPassword = "admin123";
  
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
