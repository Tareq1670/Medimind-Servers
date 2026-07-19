import { z } from "zod";

export const createChatSessionSchema = z.object({
  body: z.object({
    participants: z.array(z.string().min(1)).min(1),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateChatStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Active", "Closed"]),
  }),
  query: z.object({}).default({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const chatSessionQuerySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.enum(["Active", "Closed"]).optional(),
  }),
  params: z.object({}).default({}),
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>["body"];
export type SendMessageInput = z.infer<typeof sendMessageSchema>["body"];
