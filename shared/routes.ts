import { z } from 'zod';
import { carSales, insertCarSalesSchema } from './schema';

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
  sales: {
    list: {
      method: 'GET' as const,
      path: '/api/sales',
      input: z.object({
        month: z.string().optional(),
        nation: z.enum(['domestic', 'export']).optional(),
        minSales: z.coerce.number().optional(),
        excludeNew: z.coerce.boolean().optional(),
        sortBy: z.enum(['score', 'sales', 'rank']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof carSales.$inferSelect>()),
      },
    },
    getMonths: {
      method: 'GET' as const,
      path: '/api/sales/months',
      responses: {
        200: z.array(z.string()), // Returns list of available months YYYY-MM
      },
    },
  },
  scraper: {
    trigger: {
      method: 'POST' as const,
      path: '/api/scraper/trigger',
      input: z.object({
        month: z.string().optional(),
        nation: z.enum(['domestic', 'export']).optional(),
      }).optional(),
      responses: {
        200: z.object({
          message: z.string(),
          stats: z.object({
            processed: z.number(),
            month: z.string(),
          }),
        }),
        500: errorSchemas.internal,
      },
    },
  },
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
