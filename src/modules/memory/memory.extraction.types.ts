import type { ResolvedMemoryCandidate } from "./memory.provenance.js";

export interface ExtractionMessage {
  id: string;
  role: string;
  content: string;
}

export interface MemoryExtractionResult {
  memories: ResolvedMemoryCandidate[];
}

export interface MemoryExtractionService {
  extract(messages: ExtractionMessage[]): Promise<MemoryExtractionResult>;
}