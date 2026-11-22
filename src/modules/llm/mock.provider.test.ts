import { describe, expect, it } from "vitest";
import { MockLLMProvider } from "./mock.provider.js";

describe("MockLLMProvider", () => {
  it("returns a valid simulated response", async () => {
    const provider = new MockLLMProvider();

    const response = await provider.generate({
      systemPrompt: "Extract memories.",
      userPrompt: "I prefer Python.",
    });

    expect(response.content).toBe(
      JSON.stringify({ memories: [] })
    );
  });
});