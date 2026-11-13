
import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),

  timezone: z.string().trim().min(1).max(100).default("Asia/Kolkata"),
});

export type CreateConversationInput = z.infer<
  typeof createConversationSchema
>;


export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(20000)
});

export type CreateMessageInput = z.infer<
  typeof createMessageSchema
>;
