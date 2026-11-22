import type { LLMProvider, LLMRequest, LLMResponse } from "./llm.types.js";

export class MockLLMProvider implements LLMProvider {
  async generate(_request: LLMRequest): Promise<LLMResponse> {
    return {
      content: JSON.stringify({
        memories: [],
      }),
    };
  }
}