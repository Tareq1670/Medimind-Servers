import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    targetId: z.string().min(1),
    targetType: z.enum(["Doctor", "Medicine"]),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1).max(2000),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(1).max(2000).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const reviewQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    targetId: z.string().optional(),
    targetType: z.enum(["Doctor", "Medicine"]).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    approved: z.enum(["true", "false"]).optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>["body"];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>["body"];
