
import { describe, it, expect } from "vitest";
import { resolveMemorySources } from "./memory.provenance.js";
import type { MemoryCandidate } from "./memory.schemas.js";

const candidate: MemoryCandidate = {
  content: "The user is learning Go.",
  memory_type: "goal",
  origin: "explicit",
  confidence: 0.95,
  status: "tentative",
  source_index: 1,
};

describe("Memory Provenance Resolver", () => {
  it("resolves a valid source index to a message ID", () => {
    const messages = [
      { id: "msg-101" },
      { id: "msg-102" },
    ];

    const result = resolveMemorySources(
      [candidate],
      messages
    );

    expect(result[0].source_message_id).toBe("msg-102");
    expect(result[0]).not.toHaveProperty("source_index");
  });

  it("rejects an index outside the message array", () => {
    const messages = [{ id: "msg-101" }];

    expect(() =>
      resolveMemorySources([candidate], messages)
    ).toThrow("Invalid source index: 1");
  });

  it("rejects candidates when no messages exist", () => {
    expect(() =>
      resolveMemorySources([candidate], [])
    ).toThrow("Invalid source index: 1");
  });
});
