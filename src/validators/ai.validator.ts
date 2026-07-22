import { z } from "zod";

export const symptomAnalysisSchema = z.object({
  body: z.object({
    reportedSymptoms: z.array(z.string()).min(1, "At least one symptom is required"),
    duration: z.string().optional(),
    severity: z.string().optional(),
    additionalInfo: z.string().max(2000).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const reportAnalysisSchema = z.object({
  body: z.object({
    reportType: z.string().min(1).max(100),
    reportName: z.string().max(200).optional(),
    additionalNotes: z.string().max(2000).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const chatMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(5000),
    sessionId: z.string().optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const publicChatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(5000),
    history: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })).max(20).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const generateBlogSchema = z.object({
  body: z.object({
    topic: z.string().min(1).max(500),
    audience: z.string().optional(),
    tone: z.string().optional(),
    length: z.string().optional(),
    keyPoints: z.array(z.string()).optional(),
    includeSections: z.array(z.string()).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const recommendationSchema = z.object({
  body: z.object({
    symptoms: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    healthGoals: z.array(z.string()).optional(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const healthInsightsSchema = z.object({
  body: z.object({}).default({}),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const classifyTagsSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(500),
    description: z.string().min(1).max(5000),
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
export type ChatMessageInput = z.infer<typeof chatMessageSchema>["body"];
export type PublicChatInput = z.infer<typeof publicChatSchema>["body"];
export type GenerateBlogInput = z.infer<typeof generateBlogSchema>["body"];
export type RecommendationInput = z.infer<typeof recommendationSchema>["body"];
export type ClassifyTagsInput = z.infer<typeof classifyTagsSchema>["body"];
