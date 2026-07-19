import { z } from "zod";

export const createHealthConditionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    symptoms: z.array(z.string()).default([]),
    severity: z.enum(["Low", "Medium", "High"]),
    precautions: z.array(z.string()).default([]),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateHealthConditionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    symptoms: z.array(z.string()).optional(),
    severity: z.enum(["Low", "Medium", "High"]).optional(),
    precautions: z.array(z.string()).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const healthConditionQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    severity: z.enum(["Low", "Medium", "High"]).optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateHealthConditionInput = z.infer<typeof createHealthConditionSchema>["body"];
export type UpdateHealthConditionInput = z.infer<typeof updateHealthConditionSchema>["body"];
