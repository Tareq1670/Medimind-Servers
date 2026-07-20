import { z } from "zod";

export const userQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    role: z.enum(["user", "doctor", "admin"]).optional(),
  }),
  params: z.object({}).default({}),
});
