
import { describe, it, expect } from "vitest";
import {
  memoryCandidateSchema,
  memoryExtractionSchema,
} from "./memory.schemas.js";

describe("Memory Candidate Schema", () => {
  it("accepts a valid memory candidate", () => {
    const result = memoryCandidateSchema.safeParse({
      content: "The user prefers Python for backend development.",
      memory_type: "preference",
      origin: "explicit",
      confidence: 0.99,
      status: "current",
      source_index: 0,
    });

    expect(result.success).toBe(true);
  });

  it("rejects confidence greater than 1", () => {
    const result = memoryCandidateSchema.safeParse({
      content: "The user prefers Python.",
      memory_type: "preference",
      origin: "explicit",
      confidence: 1.5,
      status: "current",
      source_index: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown memory type", () => {
    const result = memoryCandidateSchema.safeParse({
      content: "The user knows Python.",
      memory_type: "programming_language",
      origin: "inferred",
      confidence: 0.8,
      status: "current",
      source_index: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty memory content", () => {
    const result = memoryCandidateSchema.safeParse({
      content: "   ",
      memory_type: "fact",
      origin: "inferred",
      confidence: 0.8,
      status: "current",
      source_index: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative source index", () => {
    const result = memoryCandidateSchema.safeParse({
      content: "The user prefers Python.",
      memory_type: "preference",
      origin: "explicit",
      confidence: 0.95,
      status: "current",
      source_index: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a decimal source index", () => {
    const result = memoryCandidateSchema.safeParse({
      content: "The user prefers Python.",
      memory_type: "preference",
      origin: "explicit",
      confidence: 0.95,
      status: "current",
      source_index: 1.5,
    });

    expect(result.success).toBe(false);
  });
});

describe("Memory Extraction Schema", () => {
  it("accepts an empty memories array", () => {
    const result = memoryExtractionSchema.safeParse({
      memories: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects more than 20 memories", () => {
    const result = memoryExtractionSchema.safeParse({
      memories: Array.from({ length: 21 }, () => ({
        content: "The user uses Python.",
        memory_type: "fact",
        origin: "inferred",
        confidence: 0.9,
        status: "current",
        source_index: 0,
      })),
    });

    expect(result.success).toBe(false);
  });
});
