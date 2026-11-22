import { LLMError } from "./llm.errors.js";

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withLLMRetries<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 4000,
  } = options;

  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new Error("maxAttempts must be a positive integer");
  }

  let attempt = 1;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (
        !(error instanceof LLMError) ||
        !error.retryable ||
        attempt >= maxAttempts
      ) {
        throw error;
      }

      const delay = Math.min(
        initialDelayMs * 2 ** (attempt - 1),
        maxDelayMs,
      );

      await sleep(delay);
      attempt++;
    }
  }
}