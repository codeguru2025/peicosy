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
  type ProductWithImages
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

  // Analytics
  async getAnalytics() {
    const allOrders = await db.select().from(orders);
    const allItems = await db.select().from(orderItems);
    const allProducts = await db.select().from(products);
    const allUsers = await db.select().from(users).where(eq(users.isAdmin, false));

    // Basic metrics
    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = allOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    allOrders.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    // Revenue by month (last 12 months)
    const revenueByMonth: { month: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthRevenue = allOrders
        .filter(o => o.createdAt && o.createdAt.toISOString().slice(0, 7) === monthKey)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      revenueByMonth.push({ month: monthName, revenue: monthRevenue });
    }

    // Top products by sales
    const productSales: Record<number, { totalSold: number; revenue: number }> = {};
    allItems.forEach(item => {
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

    // Top categories
    const categorySales: Record<string, { count: number; revenue: number }> = {};
    allItems.forEach(item => {
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
}

export const storage = new DatabaseStorage();
