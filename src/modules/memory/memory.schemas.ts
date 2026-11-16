
import { z } from "zod";

export const memoryCandidateSchema = z.object({
  content: z.string().trim().min(1).max(2000),

  memory_type: z.enum([
    "fact",
    "preference",
    "goal",
    "decision",
    "instruction",
    "context",
  ]),

  origin: z.enum([
    "explicit",
    "inferred",
  ]),

  confidence: z.number().min(0).max(1),

  status: z.enum([
    "current",
    "tentative",
    "superseded",
    "disputed",
    "expired",
  ]),

  source_message_id: z.string().trim().min(1),
});

export const memoryExtractionSchema = z.object({
  memories: z.array(memoryCandidateSchema).max(20),
});

export type MemoryCandidate = z.infer<
  typeof memoryCandidateSchema
>;

export type MemoryExtraction = z.infer<
  typeof memoryExtractionSchema
>;
