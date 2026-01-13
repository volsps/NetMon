import { z } from 'zod';
import { insertSiteSchema, insertSwitchSchema, insertAccessPointSchema, sites, switches, accessPoints } from './schema';

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
  sites: {
    list: {
      method: 'GET' as const,
      path: '/api/sites',
      responses: {
        200: z.array(z.custom<typeof sites.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/sites/:id',
      responses: {
        200: z.custom<typeof sites.$inferSelect & { switches: typeof switches.$inferSelect[], accessPoints: typeof accessPoints.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  search: {
    global: {
      method: 'GET' as const,
      path: '/api/search',
      input: z.object({
        q: z.string(),
      }),
      responses: {
        200: z.array(z.object({
          id: z.number(),
          type: z.enum(['site', 'switch', 'ap']),
          name: z.string(),
          detail: z.string(), // IP, Address, etc.
          siteId: z.number(),
        })),
      },
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
