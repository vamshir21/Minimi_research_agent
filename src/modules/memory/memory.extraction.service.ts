import type { LLMProvider } from "../llm/llm.types.js";
import type {
  ExtractionMessage,
  MemoryExtractionResult,
  MemoryExtractionService,
} from "./memory.extraction.types.js";


import { memoryExtractionSchema } from "./memory.schemas.js";
import { resolveMemorySources } from "./memory.provenance.js";
import { withLLMRetries } from "../llm/llm.retry.js";

function buildExtractionPrompt(messages: ExtractionMessage[]): string {
  const indexedMessages = messages.map((message, index) => ({
    index,
    role: message.role,
    content: message.content,
  }));

  return JSON.stringify(indexedMessages, null, 2);
}

const systemPrompt = `
You are a memory extraction engine.

Extract useful long-term memories from the supplied conversation messages.

Rules:
- Extract only information supported by the messages.
- Do not invent facts.
- Extract durable facts, preferences, goals, decisions,
  instructions and useful context.
- Distinguish explicit information from inferred information.
- Explicit information means the user directly stated it.
- Inferred information must be genuinely supported by context.
- Use tentative status for uncertain plans or intentions.
- Do not treat every conversation statement as a memory.
- Avoid redundant memories.
- Every memory must reference its source using source_index.
- source_index must refer to the index of a supplied message.
- Prefer user messages as sources for user-specific memories.
- Return an empty memories array if nothing worth remembering exists.
- Return ONLY valid JSON. No Markdown or additional explanation.

Output format:

{
  "memories": [
    {
      "content": "Memory content",
      "memory_type": "fact",
      "origin": "explicit",
      "confidence": 0.95,
      "status": "current",
      "source_index": 0
    }
  ]
}

Allowed memory_type values:
fact, preference, goal, decision, instruction, context

Allowed origin values:
explicit, inferred

Allowed status values:
current, tentative, superseded, disputed, expired

Confidence must be a number between 0 and 1.
`;

export class MemoryExtractionServiceImpl
  implements MemoryExtractionService
{
  constructor(private readonly provider: LLMProvider) {}

  async extract(
    messages: ExtractionMessage[],
  ): Promise<MemoryExtractionResult> {
    if (messages.length === 0) {
      return { memories: [] };
    }

    const userPrompt = buildExtractionPrompt(messages);

    const response = await withLLMRetries(
    () =>
     this.provider.generate({
      systemPrompt,
      userPrompt,
     }),
    );

    const parsedResponse: unknown = JSON.parse(response.content);

    const validatedExtraction =
      memoryExtractionSchema.parse(parsedResponse);

    const resolvedMemories = resolveMemorySources(
      validatedExtraction.memories,
      messages,
    );

    return {
      memories: resolvedMemories,
    };
  }
}