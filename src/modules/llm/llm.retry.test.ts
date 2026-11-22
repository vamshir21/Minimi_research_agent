import { describe, expect, it } from "vitest";
import { LLMError } from "./llm.errors.js";
import { withLLMRetries } from "./llm.retry.js";

describe("withLLMRetries", () => {
  it("returns immediately when the operation succeeds", async () => {
    let calls = 0;

    const result = await withLLMRetries(
      async () => {
        calls++;
        return "success";
      },
      { initialDelayMs: 0 },
    );

    expect(result).toBe("success");
    expect(calls).toBe(1);
  });

  it("retries a retryable error and eventually succeeds", async () => {
    let calls = 0;

    const result = await withLLMRetries(
      async () => {
        calls++;

        if (calls < 3) {
          throw new LLMError(
            "Temporary failure",
            "provider_error",
            true,
          );
        }

        return "success";
      },
      { initialDelayMs: 0 },
    );

    expect(result).toBe("success");
    expect(calls).toBe(3);
  });

  it("stops after exhausting maximum attempts", async () => {
    let calls = 0;

    await expect(
      withLLMRetries(
        async () => {
          calls++;

          throw new LLMError(
            "Provider unavailable",
            "provider_error",
            true,
          );
        },
        {
          maxAttempts: 3,
          initialDelayMs: 0,
        },
      ),
    ).rejects.toThrow("Provider unavailable");

    expect(calls).toBe(3);
  });

  it("does not retry a non-retryable error", async () => {
    let calls = 0;

    await expect(
      withLLMRetries(
        async () => {
          calls++;

          throw new LLMError(
            "Invalid credentials",
            "authentication_error",
            false,
          );
        },
        { initialDelayMs: 0 },
      ),
    ).rejects.toThrow("Invalid credentials");

    expect(calls).toBe(1);
  });
});