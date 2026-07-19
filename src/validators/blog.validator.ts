import { z } from "zod";

export const createBlogSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().url().optional(),
    status: z.enum(["Draft", "Published"]).default("Draft"),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateBlogSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    coverImage: z.string().url().optional(),
    status: z.enum(["Draft", "Published"]).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const blogQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    tag: z.string().optional(),
    status: z.enum(["Draft", "Published"]).optional(),
    authorId: z.string().optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>["body"];
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>["body"];
