import { z } from "zod";

export const createMedicineSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    genericName: z.string().min(1).max(200),
    category: z.string().min(1).max(100),
    manufacturer: z.string().min(1).max(200),
    price: z.number().min(0),
    stockQuantity: z.number().int().min(0).default(0),
    description: z.string().min(1).max(2000),
    image: z.string().url().optional(),
    isPrescriptionRequired: z.boolean().default(false),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateMedicineSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    genericName: z.string().min(1).max(200).optional(),
    category: z.string().min(1).max(100).optional(),
    manufacturer: z.string().min(1).max(200).optional(),
    price: z.number().min(0).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    description: z.string().min(1).max(2000).optional(),
    image: z.string().url().optional(),
    isPrescriptionRequired: z.boolean().optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const medicineQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    prescription: z.enum(["true", "false"]).optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateMedicineInput = z.infer<typeof createMedicineSchema>["body"];
export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>["body"];
