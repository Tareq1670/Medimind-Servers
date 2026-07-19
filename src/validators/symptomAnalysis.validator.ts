import { z } from "zod";

export const createSymptomAnalysisSchema = z.object({
  body: z.object({
    reportedSymptoms: z.array(z.string()).min(1),
    AI_Assessment_Result: z.string().max(5000).optional(),
    recommendedAction: z.string().max(2000).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateSymptomAnalysisSchema = z.object({
  body: z.object({
    reportedSymptoms: z.array(z.string()).optional(),
    AI_Assessment_Result: z.string().max(5000).optional(),
    recommendedAction: z.string().max(2000).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const symptomAnalysisQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    patientId: z.string().optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateSymptomAnalysisInput = z.infer<typeof createSymptomAnalysisSchema>["body"];
export type UpdateSymptomAnalysisInput = z.infer<typeof updateSymptomAnalysisSchema>["body"];
