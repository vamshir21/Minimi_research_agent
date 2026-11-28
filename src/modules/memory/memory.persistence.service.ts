
import { randomUUID } from "node:crypto";

import db from "../../database/connection.js";

import type {
  MemoryPersistenceService,
  MemoryPersistenceSummary,
} from "./memory.persistence.types.js";

import type { ResolvedMemoryCandidate } from "./memory.provenance.js";

function normalizeMemoryContent(content: string): string {
  return content
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export class MemoryPersistenceServiceImpl
  implements MemoryPersistenceService
{
  private isDuplicate(
    candidate: ResolvedMemoryCandidate,
  ): boolean {
    const existingMemories = db.prepare(`
      SELECT content
      FROM memories
      WHERE status IN ('current', 'tentative')
        AND memory_type = ?
    `).all(candidate.memory_type) as { content: string }[];

    const candidateContent = normalizeMemoryContent(
      candidate.content,
    );

    return existingMemories.some(
      (memory) =>
        normalizeMemoryContent(memory.content) ===
        candidateContent,
    );
  }

  persist(
    candidates: ResolvedMemoryCandidate[],
  ): MemoryPersistenceSummary {
    const results: MemoryPersistenceSummary["results"] = [];

    const persistTransaction = db.transaction(() => {
      for (const candidate of candidates) {
        // Step 1: Check for duplicates.
        if (this.isDuplicate(candidate)) {
          results.push({
            candidate,
            action: "duplicate",
            reason: "An equivalent memory already exists",
          });

          continue;
        }

        // Step 2: Generate application-controlled values.
        const now = new Date().toISOString();
        const memoryId = randomUUID();

        // Step 3: Insert the memory.
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

        // Step 4: Record the accepted memory in the audit log.
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

        // Step 5: Record the result.
        results.push({
          candidate,
          action: "inserted",
          memory_id: memoryId,
        });
      }
    });

    // All database writes succeed or roll back together.
    persistTransaction();

    // Step 6: Return a summary.
    return {
      total: candidates.length,

      inserted: results.filter(
        (result) => result.action === "inserted",
      ).length,

      duplicates: results.filter(
        (result) => result.action === "duplicate",
      ).length,

      superseded: results.filter(
        (result) => result.action === "superseded",
      ).length,

      rejected: results.filter(
        (result) => result.action === "rejected",
      ).length,

      results,
    };
  }
}
