import { z } from "zod";

export const symptomAnalysisSchema = z.object({
  body: z.object({
    reportedSymptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const reportAnalysisSchema = z.object({
  body: z.object({
    reportType: z.string().min(1).max(100),
    additionalNotes: z.string().max(2000).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const aiHistoryQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    type: z.enum(["symptom", "report"]).optional(),
  }),
  params: z.object({}).default({}),
});

export type SymptomAnalysisInput = z.infer<typeof symptomAnalysisSchema>["body"];
export type ReportAnalysisInput = z.infer<typeof reportAnalysisSchema>["body"];
