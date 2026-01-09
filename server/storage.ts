import { db } from "./db";
import { 
  products, 
  orders, 
  orderItems, 
  users, 
  shippingRates, 
  customsRules,
  exchangeRates,
  type Product, 
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ShippingRate,
  type CustomsRule,
  type ExchangeRate,
  type OrderWithItems,
  type User
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth";

export type CreateOrderItem = Omit<InsertOrderItem, 'orderId'>;

export interface IStorage {
  // Products
  getProducts(category?: string, search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  // Orders
  getOrders(userId: string): Promise<OrderWithItems[]>; // User's orders
  getAllOrders(): Promise<OrderWithItems[]>; // Admin
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: CreateOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string, proofUrl?: string): Promise<Order | undefined>;

  // Shipping & Customs
  getShippingRates(): Promise<ShippingRate[]>;
  getCustomsRules(countryCode: string): Promise<CustomsRule[]>;

  // Exchange Rates
  getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined>;
  updateExchangeRate(from: string, to: string, rate: number): Promise<ExchangeRate>;

  // Dashboard
  getDashboardStats(): Promise<{ totalRevenue: number, activeOrders: number, pendingVerifications: number }>;

  // Users
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string; email?: string | null; firstName?: string | null; lastName?: string | null; isAdmin?: boolean }): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    let query = db.select().from(products);
    if (category) {
      query = query.where(eq(products.category, category)) as any;
    }
    // Simple search implementation
    return await query.orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrders(userId: string): Promise<OrderWithItems[]> {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    return Promise.all(userOrders.map(o => this.getOrderWithItems(o)));
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return Promise.all(allOrders.map(o => this.getOrderWithItems(o)));
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    return this.getOrderWithItems(order);
  }

  private async getOrderWithItems(order: Order): Promise<OrderWithItems> {
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        product: products
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));
    
    // @ts-ignore - simple join mapping
    return { ...order, items };
  }

  async createOrder(orderData: InsertOrder, itemsData: CreateOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(orderData).returning();
      
      const itemsWithOrderId = itemsData.map(item => ({
        ...item,
        orderId: newOrder.id
      }));
      
      await tx.insert(orderItems).values(itemsWithOrderId);
      
      return newOrder;
    });
  }

  async updateOrderStatus(id: number, status: string, proofUrl?: string): Promise<Order | undefined> {
    const updates: any = { status };
    if (proofUrl) {
      updates.proofOfPaymentUrl = proofUrl;
    }
    
    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getDashboardStats(): Promise<{ totalRevenue: number, activeOrders: number, pendingVerifications: number }> {
    // This is a simplified implementation
    const allOrders = await db.select().from(orders);
    
    const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
    const pendingVerifications = allOrders.filter(o => o.status === 'pending_verification').length;

    return { totalRevenue, activeOrders, pendingVerifications };
  }

  // Shipping & Customs
  async getShippingRates(): Promise<ShippingRate[]> {
    return await db.select().from(shippingRates);
  }

  async getCustomsRules(countryCode: string): Promise<CustomsRule[]> {
    return await db.select().from(customsRules).where(eq(customsRules.countryCode, countryCode));
  }

  // Exchange Rates
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined> {
    const [rate] = await db.select().from(exchangeRates)
      .where(sql`${exchangeRates.fromCurrency} = ${from} AND ${exchangeRates.toCurrency} = ${to}`);
    return rate;
  }

  async updateExchangeRate(from: string, to: string, rate: number): Promise<ExchangeRate> {
    // Check if rate exists
    const existing = await this.getExchangeRate(from, to);
    
    if (existing) {
      const [updated] = await db
        .update(exchangeRates)
        .set({ rate: String(rate), updatedAt: new Date() })
        .where(eq(exchangeRates.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newRate] = await db
        .insert(exchangeRates)
        .values({ fromCurrency: from, toCurrency: to, rate: String(rate) })
        .returning();
      return newRate;
    }
  }

  // Users
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { username: string; password: string; email?: string | null; firstName?: string | null; lastName?: string | null; isAdmin?: boolean }): Promise<User> {
    const [user] = await db.insert(users).values({
      username: userData.username,
      password: userData.password,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      isAdmin: userData.isAdmin || false,
    }).returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
