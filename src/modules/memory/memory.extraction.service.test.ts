import { describe, expect, it } from "vitest";
import type { LLMProvider } from "../llm/llm.types.js";
import { MemoryExtractionServiceImpl } from "./memory.extraction.service.js";
import { LLMError } from "../llm/llm.errors.js";

function createProvider(content: string): LLMProvider {
  return {
    async generate() {
      return { content };
    },
  };
}

const messages = [
  {
    id: "msg-001",
    role: "user",
    content: "I prefer Python for backend development.",
  },
  {
    id: "msg-002",
    role: "assistant",
    content: "Noted.",
  },
];

describe("MemoryExtractionService", () => {
  it("validates extraction and resolves provenance", async () => {
    const provider = createProvider(
      JSON.stringify({
        memories: [
          {
            content: "Prefers Python for backend development.",
            memory_type: "preference",
            origin: "explicit",
            confidence: 0.95,
            status: "current",
            source_index: 0,
          },
        ],
      }),
    );

    const service = new MemoryExtractionServiceImpl(provider);

    const result = await service.extract(messages);

    expect(result.memories).toHaveLength(1);

    expect(result.memories[0]).toMatchObject({
      content: "Prefers Python for backend development.",
      memory_type: "preference",
      origin: "explicit",
      confidence: 0.95,
      status: "current",
      source_message_id: "msg-001",
    });

    expect(result.memories[0]).not.toHaveProperty("source_index");
  });

  it("returns empty memories without calling the provider for empty input", async () => {
    let called = false;

    const provider: LLMProvider = {
      async generate() {
        called = true;
        return { content: '{"memories":[]}' };
      },
    };

    const service = new MemoryExtractionServiceImpl(provider);

    const result = await service.extract([]);

    expect(result.memories).toEqual([]);
    expect(called).toBe(false);
  });

  it("rejects invalid JSON", async () => {
    const provider = createProvider("not valid JSON");

    const service = new MemoryExtractionServiceImpl(provider);

    await expect(service.extract(messages)).rejects.toThrow();
  });

  it("rejects invalid schema", async () => {
    const provider = createProvider(
      JSON.stringify({
        memories: [
          {
            content: "A memory",
            memory_type: "invalid_type",
            origin: "explicit",
            confidence: 0.9,
            status: "current",
            source_index: 0,
          },
        ],
      }),
    );

    const service = new MemoryExtractionServiceImpl(provider);

    await expect(service.extract(messages)).rejects.toThrow();
  });

 it("retries a temporary provider failure", async () => {
  let calls = 0;

  const provider: LLMProvider = {
    async generate() {
      calls++;

      if (calls === 1) {
        throw new (await import("../llm/llm.errors.js")).LLMError(
          "Temporary provider failure",
          "provider_error",
          true,
        );
      }

      return {
        content: JSON.stringify({ memories: [] }),
      };
    },
  };

  const service = new MemoryExtractionServiceImpl(provider);

  const result = await service.extract(messages);

  expect(calls).toBe(2);
  expect(result.memories).toEqual([]);
 });

});