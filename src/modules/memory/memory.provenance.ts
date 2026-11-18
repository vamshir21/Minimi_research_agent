
import type { MemoryCandidate } from "./memory.schemas.js";

interface SourceMessage {
  id: string;
}

export type ResolvedMemoryCandidate =
  Omit<MemoryCandidate, "source_index"> & {
    source_message_id: string;
  };

export function resolveMemorySources(
  candidates: MemoryCandidate[],
  messages: SourceMessage[],
): ResolvedMemoryCandidate[] {

  return candidates.map((candidate) => {
    const sourceMessage = messages[candidate.source_index];

    if (!sourceMessage) {
      throw new Error(
        `Invalid source index: ${candidate.source_index}`
      );
    }

    const { source_index, ...memory } = candidate;

    return {
      ...memory,
      source_message_id: sourceMessage.id,
    };
  });
}
