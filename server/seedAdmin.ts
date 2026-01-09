import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function seedAdminUser() {
  const adminUsername = "peicosy";
  const adminPassword = "admin123";
  
  const existingAdmin = await db.select().from(users).where(eq(users.username, adminUsername));
  
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: adminUsername,
      password: hashPassword(adminPassword),
      firstName: "Admin",
      lastName: "User",
      email: "admin@peicosy.com",
      isAdmin: true,
    });
    console.log("Default admin user created: peicosy");
  } else {
    if (!existingAdmin[0].isAdmin) {
      await db.update(users).set({ isAdmin: true }).where(eq(users.username, adminUsername));
      console.log("Existing user promoted to admin: peicosy");
    } else {
      console.log("Admin user already exists: peicosy");
    }
  }
}
