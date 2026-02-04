import { db } from "./db";
import { 
  products, 
  orders, 
  orderItems, 
  users, 
  shippingRates, 
  customsRules,
  exchangeRates,
  productImages,
  inquiries,
  processedPaymentCallbacks,
  loginAttempts,
  rateLimits,
  LOCKOUT_CONFIG,
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
  type User,
  type ProductImage,
  type InsertProductImage,
  type ProductWithImages,
  type Inquiry,
  type InsertInquiry,
  type ProcessedPaymentCallback,
  type InsertProcessedPaymentCallback,
  type LoginAttempt,
  type InsertLoginAttempt,
  type RateLimit,
  type BackgroundJob,
  backgroundJobs
} from "@shared/schema";
import { eq, desc, sql, asc } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth";

export type CreateOrderItem = Omit<InsertOrderItem, 'orderId'>;

export interface IStorage {
  // Products
  getProducts(category?: string, search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  productHasOrders(productId: number): Promise<boolean>;

  // Orders
  getOrders(userId: string): Promise<OrderWithItems[]>; // User's orders
  getAllOrders(): Promise<OrderWithItems[]>; // Admin
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getOrderWithItems(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: CreateOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string, proofUrl?: string): Promise<Order | undefined>;
  updateOrderPaynowPollUrl(id: number, pollUrl: string): Promise<void>;
  getOrderPaynowPollUrl(id: number): Promise<string | undefined>;

  // Shipping & Customs
  getShippingRates(): Promise<ShippingRate[]>;
  getCustomsRules(countryCode: string): Promise<CustomsRule[]>;

  // Exchange Rates
  getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined>;
  updateExchangeRate(from: string, to: string, rate: number): Promise<ExchangeRate>;

  // Dashboard
  getDashboardStats(): Promise<{ totalRevenue: number, activeOrders: number, pendingVerifications: number }>;

  // Analytics
  getAnalytics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    revenueByMonth: { month: string; revenue: number }[];
    topProducts: { id: number; name: string; brand: string; totalSold: number; revenue: number }[];
    topCategories: { category: string; count: number; revenue: number }[];
    customerCount: number;
    repeatCustomerRate: number;
    shippingMethodDistribution: Record<string, number>;
  }>;

  // Export Data
  getExportData(entity: 'products' | 'orders' | 'users' | 'transactions'): Promise<any[]>;

  // Users
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string; email?: string | null; firstName?: string | null; lastName?: string | null; isAdmin?: boolean }): Promise<User>;

  // Product Images
  getProductImages(productId: number): Promise<ProductImage[]>;
  getProductWithImages(productId: number): Promise<ProductWithImages | undefined>;
  addProductImage(image: InsertProductImage): Promise<ProductImage>;
  updateProductImage(id: number, updates: Partial<InsertProductImage>): Promise<ProductImage | undefined>;
  deleteProductImage(id: number): Promise<void>;
  reorderProductImages(productId: number, imageIds: number[]): Promise<void>;
  migrateProductImageUrl(productId: number): Promise<ProductImage | undefined>;

  // Inquiries
  getInquiries(): Promise<Inquiry[]>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined>;

  // Payment Idempotency
  isCallbackProcessed(gateway: string, transactionId: string): Promise<boolean>;
  recordProcessedCallback(callback: InsertProcessedPaymentCallback): Promise<ProcessedPaymentCallback>;

  // Login Attempts (Account Lockout)
  recordLoginAttempt(username: string, success: boolean, ipAddress?: string): Promise<LoginAttempt>;
  getRecentFailedAttempts(username: string): Promise<number>;
  isAccountLocked(username: string): Promise<{ locked: boolean; remainingMinutes: number }>;
  clearLoginAttempts(username: string): Promise<void>;
  
  // Rate Limiting (Distributed)
  checkRateLimit(key: string, maxRequests: number, windowMinutes: number): Promise<{ allowed: boolean; current: number; remaining: number; resetAt: Date }>;
  cleanupExpiredRateLimits(): Promise<number>;
  
  // Background Jobs (Job Queue)
  createJob(type: string, payload: object, scheduledFor?: Date, maxAttempts?: number): Promise<BackgroundJob>;
  claimNextJob(types: string[]): Promise<BackgroundJob | null>;
  completeJob(id: number): Promise<void>;
  failJob(id: number, error: string, scheduleRetry?: Date): Promise<void>;
  cancelJob(id: number): Promise<void>;
  getPendingJobs(type?: string): Promise<BackgroundJob[]>;
  cleanupOldJobs(olderThanDays: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [];
    if (category) {
      conditions.push(sql`lower(${products.category}) = lower(${category})`);
    }
    if (search) {
      conditions.push(
        sql`(lower(${products.name}) LIKE lower(${'%' + search + '%'}) 
            OR lower(${products.brand}) LIKE lower(${'%' + search + '%'})
            OR lower(${products.description}) LIKE lower(${'%' + search + '%'}))`
      );
    }
    
    if (conditions.length > 0) {
      const combinedCondition = conditions.length === 1 
        ? conditions[0] 
        : sql`${conditions[0]} AND ${conditions[1]}`;
      query = query.where(combinedCondition) as any;
    }
    
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

  async productHasOrders(productId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orderItems)
      .where(eq(orderItems.productId, productId));
    return Number(result?.count || 0) > 0;
  }

  // Orders
  async getOrders(userId: string): Promise<OrderWithItems[]> {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    if (userOrders.length === 0) return [];
    
    const orderIds = userOrders.map(o => o.id);
    const allItems = await db
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
      .where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);
    
    const itemsByOrderId = new Map<number, any[]>();
    for (const item of allItems) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push(item);
    }
    
    return userOrders.map(order => ({
      ...order,
      items: itemsByOrderId.get(order.id) || []
    })) as OrderWithItems[];
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    if (allOrders.length === 0) return [];
    
    const orderIds = allOrders.map(o => o.id);
    const allItems = await db
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
      .where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);
    
    const itemsByOrderId = new Map<number, any[]>();
    for (const item of allItems) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push(item);
    }
    
    return allOrders.map(order => ({
      ...order,
      items: itemsByOrderId.get(order.id) || []
    })) as OrderWithItems[];
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    return this.hydrateOrderWithItems(order);
  }

  async getOrderWithItems(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    return this.hydrateOrderWithItems(order);
  }

  private async hydrateOrderWithItems(order: Order): Promise<OrderWithItems> {
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
      // Aggregate quantities per productId to handle duplicate items
      const quantityByProduct: Record<number, number> = {};
      for (const item of itemsData) {
        quantityByProduct[item.productId] = (quantityByProduct[item.productId] || 0) + item.quantity;
      }
      
      const productEntries = Object.entries(quantityByProduct);
      
      // Validate stock availability and lock rows for update
      for (const [productIdStr, totalQuantity] of productEntries) {
        const productId = Number(productIdStr);
        const [product] = await tx
          .select({ id: products.id, stock: products.stock, name: products.name })
          .from(products)
          .where(eq(products.id, productId))
          .for('update');
        
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }
        
        if (product.stock < totalQuantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${totalQuantity}`);
        }
      }
      
      // Decrement stock atomically using aggregated quantities
      for (const [productIdStr, totalQuantity] of productEntries) {
        const productId = Number(productIdStr);
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${totalQuantity}` })
          .where(eq(products.id, productId));
      }
      
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
    return await db.transaction(async (tx) => {
      // Lock the order row for update to prevent race conditions
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .for('update');
      
      if (!order) return undefined;
      
      const updates: any = { status };
      if (proofUrl) {
        updates.proofOfPaymentUrl = proofUrl;
      }
      
      const [updated] = await tx
        .update(orders)
        .set(updates)
        .where(eq(orders.id, id))
        .returning();
      return updated;
    });
  }

  async updateOrderPaynowPollUrl(id: number, pollUrl: string): Promise<void> {
    await db
      .update(orders)
      .set({ paynowPollUrl: pollUrl })
      .where(eq(orders.id, id));
  }

  async getOrderPaynowPollUrl(id: number): Promise<string | undefined> {
    const [order] = await db
      .select({ paynowPollUrl: orders.paynowPollUrl })
      .from(orders)
      .where(eq(orders.id, id));
    return order?.paynowPollUrl || undefined;
  }

  async getDashboardStats(): Promise<{ totalRevenue: number, activeOrders: number, pendingVerifications: number }> {
    const allOrders = await db.select().from(orders);
    
    // Only count revenue from orders that are actually paid (not failed, cancelled, or pending payment)
    const paidStatuses = ['paid', 'processing', 'shipped', 'completed', 'pending_verification'];
    const paidOrders = allOrders.filter(o => paidStatuses.includes(o.status));
    
    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'payment_failed').length;
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

  // Analytics
  async getAnalytics() {
    const allOrders = await db.select().from(orders);
    const allItems = await db.select().from(orderItems);
    const allProducts = await db.select().from(products);
    const allUsers = await db.select().from(users).where(eq(users.isAdmin, false));

    // Only count revenue from orders that are actually paid (not failed, cancelled, or pending payment)
    const paidStatuses = ['paid', 'processing', 'shipped', 'completed', 'pending_verification'];
    const paidOrders = allOrders.filter(o => paidStatuses.includes(o.status));

    // Basic metrics - use paidOrders for revenue calculations
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = allOrders.length;
    const paidOrderCount = paidOrders.length;
    const averageOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    allOrders.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    // Revenue by month (last 12 months) - only count paid orders
    const revenueByMonth: { month: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthRevenue = paidOrders
        .filter(o => o.createdAt && o.createdAt.toISOString().slice(0, 7) === monthKey)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      revenueByMonth.push({ month: monthName, revenue: monthRevenue });
    }

    // Top products by sales - only count items from paid orders
    const paidOrderIds = new Set(paidOrders.map(o => o.id));
    const paidItems = allItems.filter(item => paidOrderIds.has(item.orderId));
    
    const productSales: Record<number, { totalSold: number; revenue: number }> = {};
    paidItems.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { totalSold: 0, revenue: 0 };
      }
      productSales[item.productId].totalSold += item.quantity;
      productSales[item.productId].revenue += Number(item.priceAtPurchase) * item.quantity;
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => {
        const product = allProducts.find(p => p.id === Number(id));
        return {
          id: Number(id),
          name: product?.name || 'Unknown',
          brand: product?.brand || 'Unknown',
          ...data
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top categories - only count items from paid orders
    const categorySales: Record<string, { count: number; revenue: number }> = {};
    paidItems.forEach(item => {
      const product = allProducts.find(p => p.id === item.productId);
      const category = product?.category || 'Other';
      if (!categorySales[category]) {
        categorySales[category] = { count: 0, revenue: 0 };
      }
      categorySales[category].count += item.quantity;
      categorySales[category].revenue += Number(item.priceAtPurchase) * item.quantity;
    });

    const topCategories = Object.entries(categorySales)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Customer metrics
    const customerCount = allUsers.length;
    const ordersByUser: Record<string, number> = {};
    allOrders.forEach(o => {
      ordersByUser[o.userId] = (ordersByUser[o.userId] || 0) + 1;
    });
    const repeatCustomers = Object.values(ordersByUser).filter(count => count > 1).length;
    const repeatCustomerRate = Object.keys(ordersByUser).length > 0 
      ? (repeatCustomers / Object.keys(ordersByUser).length) * 100 
      : 0;

    // Shipping method distribution
    const shippingMethodDistribution: Record<string, number> = {};
    allOrders.forEach(o => {
      shippingMethodDistribution[o.shippingMethod] = (shippingMethodDistribution[o.shippingMethod] || 0) + 1;
    });

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      ordersByStatus,
      revenueByMonth,
      topProducts,
      topCategories,
      customerCount,
      repeatCustomerRate,
      shippingMethodDistribution,
    };
  }

  // Export Data
  async getExportData(entity: 'products' | 'orders' | 'users' | 'transactions'): Promise<any[]> {
    switch (entity) {
      case 'products':
        return await db.select().from(products).orderBy(desc(products.createdAt));
      
      case 'orders': {
        const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
        return Promise.all(allOrders.map(async (order) => {
          const items = await db
            .select({
              productId: orderItems.productId,
              quantity: orderItems.quantity,
              priceAtPurchase: orderItems.priceAtPurchase,
              productName: products.name,
              productBrand: products.brand,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));
          
          const user = await db.select({ email: users.email, username: users.username }).from(users).where(eq(users.id, order.userId));
          
          return {
            orderId: order.id,
            customerEmail: user[0]?.email || 'N/A',
            customerUsername: user[0]?.username || 'N/A',
            status: order.status,
            totalAmount: order.totalAmount,
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            shippingCost: order.shippingCost,
            customsDuty: order.customsDuty,
            itemCount: items.length,
            items: items.map(i => `${i.productBrand} ${i.productName} x${i.quantity}`).join('; '),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          };
        }));
      }
      
      case 'users': {
        const allUsers = await db.select({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        }).from(users).orderBy(desc(users.createdAt));
        return allUsers;
      }
      
      case 'transactions': {
        const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
        return Promise.all(allOrders.map(async (order) => {
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
          const user = await db.select({ email: users.email, username: users.username }).from(users).where(eq(users.id, order.userId));
          
          return {
            transactionId: `TXN-${order.id}`,
            orderId: order.id,
            customerEmail: user[0]?.email || 'N/A',
            customerUsername: user[0]?.username || 'N/A',
            subtotal: Number(order.totalAmount) - Number(order.shippingCost) - Number(order.customsDuty),
            shippingCost: order.shippingCost,
            customsDuty: order.customsDuty,
            totalAmount: order.totalAmount,
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            status: order.status,
            hasPaymentProof: !!order.proofOfPaymentUrl,
            itemCount: items.length,
            createdAt: order.createdAt,
          };
        }));
      }
      
      default:
        return [];
    }
  }

  // Product Images
  async getProductImages(productId: number): Promise<ProductImage[]> {
    return await db.select().from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder));
  }

  async getProductWithImages(productId: number): Promise<ProductWithImages | undefined> {
    const product = await this.getProduct(productId);
    if (!product) return undefined;
    
    const images = await this.getProductImages(productId);
    return { ...product, images };
  }

  async addProductImage(image: InsertProductImage): Promise<ProductImage> {
    // If this is a thumbnail, remove existing thumbnail
    if (image.role === 'thumbnail') {
      await db.update(productImages)
        .set({ role: 'gallery' })
        .where(sql`${productImages.productId} = ${image.productId} AND ${productImages.role} = 'thumbnail'`);
    }
    
    // If this is a hero, remove existing hero
    if (image.role === 'hero') {
      await db.update(productImages)
        .set({ role: 'gallery' })
        .where(sql`${productImages.productId} = ${image.productId} AND ${productImages.role} = 'hero'`);
    }
    
    const [newImage] = await db.insert(productImages).values(image).returning();
    return newImage;
  }

  async updateProductImage(id: number, updates: Partial<InsertProductImage>): Promise<ProductImage | undefined> {
    // If changing role to thumbnail/hero, demote existing one first
    if (updates.role === 'thumbnail' || updates.role === 'hero') {
      const [image] = await db.select().from(productImages).where(eq(productImages.id, id));
      if (image) {
        await db.update(productImages)
          .set({ role: 'gallery' })
          .where(sql`${productImages.productId} = ${image.productId} AND ${productImages.role} = ${updates.role} AND ${productImages.id} != ${id}`);
      }
    }
    
    const [updated] = await db
      .update(productImages)
      .set(updates)
      .where(eq(productImages.id, id))
      .returning();
    return updated;
  }

  async deleteProductImage(id: number): Promise<void> {
    await db.delete(productImages).where(eq(productImages.id, id));
  }

  async reorderProductImages(productId: number, imageIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < imageIds.length; i++) {
        await tx.update(productImages)
          .set({ sortOrder: i })
          .where(eq(productImages.id, imageIds[i]));
      }
    });
  }

  async migrateProductImageUrl(productId: number): Promise<ProductImage | undefined> {
    const product = await this.getProduct(productId);
    if (!product || !product.imageUrl) return undefined;
    
    // Check if already migrated
    const existing = await db.select().from(productImages)
      .where(sql`${productImages.productId} = ${productId} AND ${productImages.isLegacy} = true`);
    if (existing.length > 0) return existing[0];
    
    // Create legacy image entry from existing URL
    const [legacyImage] = await db.insert(productImages).values({
      productId,
      role: 'thumbnail',
      objectPath: product.imageUrl, // External URL stored as path
      cdnUrl: product.imageUrl,
      mimeType: 'image/jpeg', // Assume JPEG for external URLs
      isLegacy: true,
      sortOrder: 0,
    }).returning();
    
    return legacyImage;
  }

  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined> {
    const [updated] = await db
      .update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  // Payment Idempotency
  async isCallbackProcessed(gateway: string, transactionId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(processedPaymentCallbacks)
      .where(sql`${processedPaymentCallbacks.gateway} = ${gateway} AND ${processedPaymentCallbacks.transactionId} = ${transactionId}`);
    return !!existing;
  }

  async recordProcessedCallback(callback: InsertProcessedPaymentCallback): Promise<ProcessedPaymentCallback> {
    const [recorded] = await db
      .insert(processedPaymentCallbacks)
      .values(callback)
      .returning();
    return recorded;
  }

  // Login Attempts (Account Lockout)
  async recordLoginAttempt(username: string, success: boolean, ipAddress?: string): Promise<LoginAttempt> {
    const [attempt] = await db
      .insert(loginAttempts)
      .values({
        username: username.toLowerCase(),
        success,
        ipAddress: ipAddress || null,
      })
      .returning();
    return attempt;
  }

  async getRecentFailedAttempts(username: string): Promise<number> {
    const windowStart = new Date(Date.now() - LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60 * 1000);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(loginAttempts)
      .where(sql`
        ${loginAttempts.username} = ${username.toLowerCase()}
        AND ${loginAttempts.success} = false
        AND ${loginAttempts.attemptedAt} > ${windowStart}
      `);
    
    return Number(result[0]?.count || 0);
  }

  async isAccountLocked(username: string): Promise<{ locked: boolean; remainingMinutes: number }> {
    const failedAttempts = await this.getRecentFailedAttempts(username);
    
    if (failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
      const lockoutStart = new Date(Date.now() - LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      
      const [lastAttempt] = await db
        .select({ attemptedAt: loginAttempts.attemptedAt })
        .from(loginAttempts)
        .where(sql`
          ${loginAttempts.username} = ${username.toLowerCase()}
          AND ${loginAttempts.success} = false
        `)
        .orderBy(desc(loginAttempts.attemptedAt))
        .limit(1);
      
      if (lastAttempt && lastAttempt.attemptedAt && lastAttempt.attemptedAt > lockoutStart) {
        const unlockTime = new Date(lastAttempt.attemptedAt.getTime() + LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000);
        const remainingMs = unlockTime.getTime() - Date.now();
        const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
        
        return { locked: true, remainingMinutes };
      }
    }
    
    return { locked: false, remainingMinutes: 0 };
  }

  async clearLoginAttempts(username: string): Promise<void> {
    await db
      .delete(loginAttempts)
      .where(eq(loginAttempts.username, username.toLowerCase()));
  }

  // === Rate Limiting ===
  async checkRateLimit(key: string, maxRequests: number, windowMinutes: number): Promise<{ allowed: boolean; current: number; remaining: number; resetAt: Date }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
    const expiresAt = new Date(now.getTime() + windowMinutes * 60 * 1000);
    
    // Use a transaction for atomic read-modify-write
    const result = await db.transaction(async (tx) => {
      // Clean up expired entries for this key
      await tx
        .delete(rateLimits)
        .where(sql`${rateLimits.key} = ${key} AND ${rateLimits.expiresAt} < ${now}`);
      
      // Get current entry
      const [existing] = await tx
        .select()
        .from(rateLimits)
        .where(sql`${rateLimits.key} = ${key} AND ${rateLimits.windowStart} > ${windowStart}`)
        .limit(1);
      
      if (existing) {
        // Entry exists - increment count
        const newCount = existing.count + 1;
        const allowed = newCount <= maxRequests;
        
        if (allowed) {
          await tx
            .update(rateLimits)
            .set({ count: newCount })
            .where(eq(rateLimits.id, existing.id));
        }
        
        return {
          allowed,
          current: allowed ? newCount : existing.count,
          remaining: Math.max(0, maxRequests - (allowed ? newCount : existing.count)),
          resetAt: existing.expiresAt || expiresAt,
        };
      } else {
        // No entry - create new one
        await tx.insert(rateLimits).values({
          key,
          count: 1,
          windowStart: now,
          expiresAt,
        });
        
        return {
          allowed: true,
          current: 1,
          remaining: maxRequests - 1,
          resetAt: expiresAt,
        };
      }
    });
    
    return result;
  }

  async cleanupExpiredRateLimits(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(rateLimits)
      .where(sql`${rateLimits.expiresAt} < ${now}`)
      .returning();
    
    return result.length;
  }

  // === Background Jobs ===
  async createJob(type: string, payload: object, scheduledFor?: Date, maxAttempts: number = 3): Promise<BackgroundJob> {
    const [job] = await db.insert(backgroundJobs).values({
      type,
      payload,
      status: "pending",
      attempts: 0,
      maxAttempts,
      scheduledFor: scheduledFor || new Date(),
    }).returning();
    return job;
  }

  async claimNextJob(types: string[]): Promise<BackgroundJob | null> {
    const now = new Date();
    
    if (types.length === 0) return null;
    
    const result = await db.transaction(async (tx) => {
      const [job] = await tx
        .select()
        .from(backgroundJobs)
        .where(sql`
          ${backgroundJobs.status} = 'pending'
          AND ${backgroundJobs.type} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})
          AND ${backgroundJobs.scheduledFor} <= ${now}
          AND ${backgroundJobs.attempts} < ${backgroundJobs.maxAttempts}
        `)
        .orderBy(asc(backgroundJobs.scheduledFor))
        .limit(1)
        .for("update", { skipLocked: true });
      
      if (!job) return null;
      
      const [updated] = await tx
        .update(backgroundJobs)
        .set({
          status: "processing",
          attempts: job.attempts + 1,
          startedAt: now,
        })
        .where(eq(backgroundJobs.id, job.id))
        .returning();
      
      return updated;
    });
    
    return result;
  }

  async completeJob(id: number): Promise<void> {
    await db
      .update(backgroundJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(backgroundJobs.id, id));
  }

  async failJob(id: number, error: string, scheduleRetry?: Date): Promise<void> {
    const [job] = await db.select().from(backgroundJobs).where(eq(backgroundJobs.id, id));
    if (!job) return;
    
    const isFinalAttempt = job.attempts >= job.maxAttempts;
    
    await db
      .update(backgroundJobs)
      .set({
        status: isFinalAttempt ? "failed" : "pending",
        lastError: error,
        scheduledFor: scheduleRetry || new Date(),
        startedAt: null,
      })
      .where(eq(backgroundJobs.id, id));
  }

  async cancelJob(id: number): Promise<void> {
    await db
      .update(backgroundJobs)
      .set({ status: "cancelled" })
      .where(eq(backgroundJobs.id, id));
  }

  async getPendingJobs(type?: string): Promise<BackgroundJob[]> {
    let query = db.select().from(backgroundJobs).where(eq(backgroundJobs.status, "pending"));
    if (type) {
      query = db.select().from(backgroundJobs).where(sql`${backgroundJobs.status} = 'pending' AND ${backgroundJobs.type} = ${type}`);
    }
    return await query.orderBy(asc(backgroundJobs.scheduledFor));
  }

  async cleanupOldJobs(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(backgroundJobs)
      .where(sql`
        ${backgroundJobs.completedAt} < ${cutoff}
        OR (${backgroundJobs.status} = 'failed' AND ${backgroundJobs.createdAt} < ${cutoff})
        OR (${backgroundJobs.status} = 'cancelled' AND ${backgroundJobs.createdAt} < ${cutoff})
      `)
      .returning();
    
    return result.length;
  }
}

export const storage = new DatabaseStorage();
