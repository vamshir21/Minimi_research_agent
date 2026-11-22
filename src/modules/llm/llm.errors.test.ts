import { describe, expect, it } from "vitest";
import { LLMError } from "./llm.errors.js";

describe("LLMError", () => {
  it("preserves error classification and retry policy", () => {
    const error = new LLMError(
      "Provider timed out",
      "timeout",
      true,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(LLMError);
    expect(error.name).toBe("LLMError");
    expect(error.message).toBe("Provider timed out");
    expect(error.code).toBe("timeout");
    expect(error.retryable).toBe(true);
  });

  it("supports non-retryable errors", () => {
    const error = new LLMError(
      "Invalid credentials",
      "authentication_error",
      false,
    );

    expect(error.code).toBe("authentication_error");
    expect(error.retryable).toBe(false);
  });

  it("preserves the original error using cause", () => {
    const originalError = new Error("Network failure");

    const error = new LLMError(
      "Provider request failed",
      "provider_error",
      true,
      { cause: originalError },
    );

    expect(error.cause).toBe(originalError);
  });
});