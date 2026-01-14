import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth Models
export * from "./models/auth";
import { users } from "./models/auth";

// === PRODUCTS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(), // Legacy field - kept for backward compatibility
  stock: integer("stock").notNull().default(0),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });

// === PRODUCT IMAGES ===
// Supports multiple images per product with roles (thumbnail, hero, gallery)
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  role: text("role").notNull().default("gallery"), // 'thumbnail' | 'hero' | 'gallery'
  objectPath: text("object_path").notNull(), // Path in object storage
  cdnUrl: text("cdn_url").notNull(), // Public URL for serving
  originalFilename: text("original_filename"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size"), // bytes
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  isLegacy: boolean("is_legacy").default(false), // True for migrated external URLs
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({ id: true, createdAt: true });

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// === SHIPPING RATES ===
export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  method: text("method").notNull(), // 'air' | 'sea'
  minWeight: numeric("min_weight", { precision: 10, scale: 2 }).notNull(), // kg
  maxWeight: numeric("max_weight", { precision: 10, scale: 2 }).notNull(), // kg
  rate: numeric("rate", { precision: 10, scale: 2 }).notNull(), // per kg or flat? Assuming flat rate for range for simplicity, or rate per kg. Let's say rate per kg.
  currency: text("currency").notNull().default("GBP"),
});

export const insertShippingRateSchema = createInsertSchema(shippingRates).omit({ id: true });

// === CUSTOMS RULES ===
export const customsRules = pgTable("customs_rules", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull(), // 'ZA'
  category: text("category").notNull(),
  dutyPercentage: numeric("duty_percentage", { precision: 5, scale: 2 }).notNull(), // e.g. 45.00 for 45%
  threshold: numeric("threshold", { precision: 10, scale: 2 }).default('0'), // Value above which duty applies
  currency: text("currency").notNull().default("ZAR"),
});

export const insertCustomsRuleSchema = createInsertSchema(customsRules).omit({ id: true });

// === ORDER STATUS ENUM ===
export const OrderStatus = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING_VERIFICATION: 'pending_verification',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  ARRIVED: 'arrived',
  READY_COLLECTION: 'ready_collection',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// === INQUIRY STATUS ENUM ===
export const InquiryStatus = {
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied',
  CLOSED: 'closed',
} as const;

export type InquiryStatusType = typeof InquiryStatus[keyof typeof InquiryStatus];

// === ORDERS ===
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default(OrderStatus.PENDING_PAYMENT),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),
  shippingMethod: text("shipping_method").notNull(),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  customsDuty: numeric("customs_duty", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  proofOfPaymentUrl: text("proof_of_payment_url"),
  paynowPollUrl: text("paynow_poll_url"),
  paymentReference: text("payment_reference").unique(),
  expectedAmountUsd: numeric("expected_amount_usd", { precision: 10, scale: 2 }),
  expectedAmountZar: numeric("expected_amount_zar", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true, status: true });

// === ORDER ITEMS ===
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: numeric("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

// === RELATIONS ===
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  images: many(productImages),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// === INQUIRIES ===
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // 'new' | 'read' | 'replied' | 'closed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true, status: true });

// === EXCHANGE RATES ===
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull().default("GBP"),
  toCurrency: text("to_currency").notNull().default("ZAR"),
  rate: numeric("rate", { precision: 12, scale: 4 }).notNull(), // e.g., 23.50 means 1 GBP = 23.50 ZAR
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === PROCESSED PAYMENT CALLBACKS (Idempotency) ===
export const processedPaymentCallbacks = pgTable("processed_payment_callbacks", {
  id: serial("id").primaryKey(),
  gateway: text("gateway").notNull(), // 'payfast' | 'paynow'
  transactionId: text("transaction_id").notNull(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  status: text("status").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  processedAt: timestamp("processed_at").defaultNow(),
  rawPayload: jsonb("raw_payload"),
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({ id: true, updatedAt: true });
export const insertProcessedCallbackSchema = createInsertSchema(processedPaymentCallbacks).omit({ id: true, processedAt: true });

// === TYPES ===
export type ProcessedPaymentCallback = typeof processedPaymentCallbacks.$inferSelect;
export type InsertProcessedPaymentCallback = z.infer<typeof insertProcessedCallbackSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;

// Product with images for API responses
export type ProductWithImages = Product & {
  images: ProductImage[];
};

export type ShippingRate = typeof shippingRates.$inferSelect;
export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;

export type CustomsRule = typeof customsRules.$inferSelect;
export type InsertCustomsRule = z.infer<typeof insertCustomsRuleSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Extended Order type for API responses
export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};

export type CreateOrderRequest = {
  items: { productId: number; quantity: number }[];
  shippingMethod: 'air' | 'sea';
  shippingAddress: any;
};

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

// === API VALIDATION SCHEMAS ===

// Authentication validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  email: z.string().email("Please enter a valid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Shipping address validation
export const shippingAddressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  zip: z.string().min(1, "Postal/ZIP code is required"),
  country: z.enum(["South Africa", "Zimbabwe"]),
});

// Order creation validation
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().positive("Invalid product"),
    quantity: z.number().int().positive("Quantity must be at least 1"),
  })).min(1, "Order must have at least one item"),
  shippingMethod: z.enum(["air", "sea"]),
  shippingAddress: shippingAddressSchema,
});

// Shipping calculation validation
export const calculateShippingSchema = z.object({
  items: z.array(z.object({
    productId: z.number().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
  shippingMethod: z.enum(["air", "sea"]),
  destinationCountry: z.string().optional(),
});

// Paynow payment validation
export const paynowInitiateSchema = z.object({
  orderId: z.number().positive("Invalid order ID"),
});

export const paynowMobileSchema = z.object({
  orderId: z.number().positive("Invalid order ID"),
  phone: z.string().regex(/^0[7][0-9]{8}$/, "Please enter a valid Zimbabwe phone number (e.g., 0771234567)"),
  method: z.enum(["ecocash", "onemoney"]),
});

// Type exports for validation schemas
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateOrderRequest2 = z.infer<typeof createOrderSchema>;
export type CalculateShippingRequest = z.infer<typeof calculateShippingSchema>;
export type PaynowInitiateRequest = z.infer<typeof paynowInitiateSchema>;
export type PaynowMobileRequest = z.infer<typeof paynowMobileSchema>;
