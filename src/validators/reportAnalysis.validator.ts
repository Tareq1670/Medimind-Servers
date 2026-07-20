import { z } from "zod";

export const createReportAnalysisSchema = z.object({
  body: z.object({
    reportType: z.string().min(1).max(100),
    reportName: z.string().max(200).optional(),
    structuredData: z.record(z.string(), z.unknown()).optional(),
    analysisSummary: z.string().max(5000).optional(),
    aiDoctorNotes: z.string().max(5000).optional(),
    aiAnalysis: z.object({
      summary: z.string().optional(),
      keyFindings: z.array(z.string()).optional(),
      recommendations: z.array(z.string()).optional(),
      riskIndicators: z.array(z.string()).optional(),
      normalValues: z.record(z.string(), z.unknown()).optional(),
      abnormalValues: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const updateReportAnalysisSchema = z.object({
  body: z.object({
    reportType: z.string().min(1).max(100).optional(),
    structuredData: z.record(z.string(), z.unknown()).optional(),
    analysisSummary: z.string().max(5000).optional(),
    aiDoctorNotes: z.string().max(5000).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const reportAnalysisQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    reportType: z.string().optional(),
    patientId: z.string().optional(),
    search: z.string().optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateReportAnalysisInput = z.infer<typeof createReportAnalysisSchema>["body"];
export type UpdateReportAnalysisInput = z.infer<typeof updateReportAnalysisSchema>["body"];
