import { z } from "zod";
import { articles } from "./schema";

export const api = {
  articles: {
    search: {
      method: "GET" as const,
      path: "/api/search",
      input: z.object({
        q: z.string(),
        limit: z.coerce.number().default(10),
      }),
      responses: {
        200: z.object({
          results: z.array(z.custom<typeof articles.$inferSelect & { score: number }>()),
          query: z.string(),
        }),
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/articles",
      input: z.object({
        limit: z.coerce.number().default(20),
        offset: z.coerce.number().default(0),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof articles.$inferSelect>()),
      },
    }
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
