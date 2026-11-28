
import { randomUUID } from "node:crypto";

import db from "../../database/connection.js";

import type {
  MemoryPersistenceService,
  MemoryPersistenceSummary,
} from "./memory.persistence.types.js";

import type { ResolvedMemoryCandidate } from "./memory.provenance.js";

export class MemoryPersistenceServiceImpl
  implements MemoryPersistenceService
{
  persist(
    candidates: ResolvedMemoryCandidate[],
  ): MemoryPersistenceSummary {
    const results: MemoryPersistenceSummary["results"] = [];

    const persistTransaction = db.transaction(() => {
      for (const candidate of candidates) {
        const now = new Date().toISOString();
        const memoryId = randomUUID();

        db.prepare(`
          INSERT INTO memories (
            id,
            content,
            memory_type,
            origin,
            confidence,
            status,
            source_message_id,
            extracted_at,
            valid_from,
            valid_until,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          memoryId,
          candidate.content,
          candidate.memory_type,
          candidate.origin,
          candidate.confidence,
          candidate.status,
          candidate.source_message_id,
          now,
          null,
          null,
          now,
          now,
        );

        db.prepare(`
          INSERT INTO memory_audit (
            id,
            memory_id,
            source_message_id,
            action,
            proposed_content,
            reason,
            recorded_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          randomUUID(),
          memoryId,
          candidate.source_message_id,
          "accepted",
          candidate.content,
          "Memory successfully persisted",
          now,
        );

        results.push({
          candidate,
          action: "inserted",
          memory_id: memoryId,
        });
      }
    });

    persistTransaction();

    return {
      total: candidates.length,
      inserted: results.length,
      duplicates: 0,
      superseded: 0,
      rejected: 0,
      results,
    };
  }
}
