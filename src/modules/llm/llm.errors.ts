export type LLMErrorCode =
  | "timeout"
  | "rate_limit"
  | "provider_error"
  | "invalid_response"
  | "authentication_error"
  | "configuration_error"
  | "request_error";

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: LLMErrorCode,
    public readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = "LLMError";
  }
}
