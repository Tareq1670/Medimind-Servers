import { z } from "zod";

const currentMedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  startDate: z.string().datetime().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
});

export const createHealthRecordSchema = z.object({
  body: z.object({
    chronicConditions: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    currentMedications: z.array(currentMedicationSchema).default([]),
    emergencyContact: emergencyContactSchema.optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateHealthRecordSchema = z.object({
  body: z.object({
    chronicConditions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    currentMedications: z.array(currentMedicationSchema).optional(),
    emergencyContact: emergencyContactSchema.optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type CreateHealthRecordInput = z.infer<typeof createHealthRecordSchema>["body"];
export type UpdateHealthRecordInput = z.infer<typeof updateHealthRecordSchema>["body"];
