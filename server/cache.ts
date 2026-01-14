interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  oldestAge: number | null;
  newestAge: number | null;
}

const DEFAULT_TTL = 5 * 60 * 1000;

class ProductCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private hits = 0;
  private misses = 0;
  private ttl: number;

  constructor(ttl: number = DEFAULT_TTL) {
    this.ttl = ttl;
  }

  private generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sorted = Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join("|");
    return sorted ? `${prefix}:${sorted}` : prefix;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  async get<T>(
    prefix: string,
    params: Record<string, any>,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (entry && !this.isExpired(entry)) {
      this.hits++;
      return entry.value as T;
    }

    this.misses++;
    const value = await fetcher();
    this.set(key, value);
    return value;
  }

  set<T>(key: string, value: T): void {
    const now = Date.now();
    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt: now + this.ttl,
    });
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key === prefix || key.startsWith(`${prefix}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    const now = Date.now();
    let oldestAge: number | null = null;
    let newestAge: number | null = null;
    let validEntries = 0;

    this.cache.forEach(entry => {
      if (!this.isExpired(entry)) {
        validEntries++;
        const age = now - entry.createdAt;
        if (oldestAge === null || age > oldestAge) oldestAge = age;
        if (newestAge === null || age < newestAge) newestAge = age;
      }
    });

    const total = this.hits + this.misses;
    return {
      entries: validEntries,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      oldestAge,
      newestAge,
    };
  }

  cleanup(): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const productCache = new ProductCache();

export const cacheKeys = {
  products: "products",
  product: "product",
  productWithImages: "productWithImages",
} as const;

export function invalidateProductCaches(): void {
  productCache.invalidate(cacheKeys.products);
  productCache.invalidate(cacheKeys.product);
  productCache.invalidate(cacheKeys.productWithImages);
}
