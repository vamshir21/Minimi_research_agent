export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface LLMResponse {
  content: string;
}

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}
