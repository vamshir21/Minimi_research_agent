import type { ResolvedMemoryCandidate } from "./memory.provenance.js";

export type MemoryPersistenceAction =
  | "inserted"
  | "duplicate"
  | "superseded"
  | "rejected";

export interface MemoryPersistenceResult {
  candidate: ResolvedMemoryCandidate;
  action: MemoryPersistenceAction;
  memory_id?: string;
  reason?: string;
}

export interface MemoryPersistenceSummary {
  total: number;
  inserted: number;
  duplicates: number;
  superseded: number;
  rejected: number;
  results: MemoryPersistenceResult[];
}

export interface MemoryPersistenceService {
  persist(
    candidates: ResolvedMemoryCandidate[],
  ): MemoryPersistenceSummary;
}