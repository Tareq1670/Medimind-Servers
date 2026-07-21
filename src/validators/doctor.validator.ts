import { z } from "zod";

const availabilitySlotSchema = z.object({
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  isAvailable: z.boolean().default(true),
});

export const createDoctorSchema = z.object({
  body: z.object({
    specialty: z.string().min(1).max(100),
    experienceYears: z.number().int().min(0),
    hospitalAffiliation: z.string().min(1).max(200),
    bio: z.string().min(1).max(2000),
    consultationFee: z.number().min(0),
    availabilitySlots: z.array(availabilitySlotSchema).default([]),
    isVerified: z.boolean().default(false),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    specialty: z.string().min(1).max(100).optional(),
    experienceYears: z.number().int().min(0).optional(),
    hospitalAffiliation: z.string().min(1).max(200).optional(),
    bio: z.string().min(1).max(2000).optional(),
    consultationFee: z.number().min(0).optional(),
    availabilitySlots: z.array(availabilitySlotSchema).optional(),
    isVerified: z.boolean().optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const doctorQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    specialty: z.string().optional(),
    minFee: z.coerce.number().min(0).optional(),
    maxFee: z.coerce.number().min(0).optional(),
    verified: z.enum(["true", "false"]).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    sortBy: z.enum(["consultationFee", "experienceYears", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>["body"];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>["body"];
