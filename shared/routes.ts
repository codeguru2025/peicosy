import { z } from 'zod';
import { 
  insertProductSchema, 
  products, 
  insertShippingRateSchema, 
  shippingRates, 
  insertCustomsRuleSchema, 
  customsRules, 
  orders,
  insertOrderSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products',
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.validation, // Unauthorized
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id',
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.any()), // Typed manually in frontend as OrderWithItems
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id',
      responses: {
        200: z.any(), // OrderWithItems
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().min(1),
        })),
        shippingMethod: z.enum(['air', 'sea']),
        shippingAddress: z.any(), // JSONB
      }),
      responses: {
        201: z.any(), // Order
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status',
      input: z.object({
        status: z.enum([
          'pending_payment', 
          'pending_verification', 
          'confirmed', 
          'shipped', 
          'arrived', 
          'ready_collection', 
          'completed'
        ]),
        proofOfPaymentUrl: z.string().optional(),
      }),
      responses: {
        200: z.any(), // Order
        404: errorSchemas.notFound,
      },
    }
  },
  admin: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/admin/dashboard',
      responses: {
        200: z.object({
          totalRevenue: z.number(),
          activeOrders: z.number(),
          pendingVerifications: z.number(),
        }),
      }
    },
    orders: {
      method: 'GET' as const,
      path: '/api/admin/orders',
      responses: {
        200: z.array(z.any()),
      }
    }
  },
  shipping: {
    rates: {
      method: 'GET' as const,
      path: '/api/shipping/rates',
      responses: {
        200: z.array(z.custom<typeof shippingRates.$inferSelect>()),
      }
    },
    calculate: {
      method: 'POST' as const,
      path: '/api/shipping/calculate',
      input: z.object({
        subtotal: z.number(),
        method: z.enum(['air', 'sea']),
        category: z.string().optional(),
      }),
      responses: {
        200: z.object({
          shippingCost: z.number(),
          customsDuty: z.number(),
          total: z.number(),
          // ZAR equivalents
          subtotalZAR: z.number().optional(),
          shippingCostZAR: z.number().optional(),
          customsDutyZAR: z.number().optional(),
          totalZAR: z.number().optional(),
          exchangeRate: z.number().optional(),
        }),
      }
    }
  },
  exchangeRate: {
    get: {
      method: 'GET' as const,
      path: '/api/exchange-rate',
      responses: {
        200: z.object({
          rate: z.number(),
          fromCurrency: z.string(),
          toCurrency: z.string(),
          updatedAt: z.string().optional(),
        }),
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/exchange-rate',
      input: z.object({
        rate: z.number().positive(),
      }),
      responses: {
        200: z.object({
          rate: z.number(),
          fromCurrency: z.string(),
          toCurrency: z.string(),
          updatedAt: z.string().optional(),
        }),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
