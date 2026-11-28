
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import db from "../../database/connection.js";

import {
  MemoryPersistenceServiceImpl,
} from "./memory.persistence.service.js";

import type {
  ResolvedMemoryCandidate,
} from "./memory.provenance.js";

const service = new MemoryPersistenceServiceImpl();

const candidate: ResolvedMemoryCandidate = {
  content: "The user is learning Rust.",
  memory_type: "goal",
  origin: "explicit",
  confidence: 0.95,
  status: "current",
  source_message_id: "test-message-1",
};

beforeEach(() => {
  // Clean test data in foreign-key dependency order.
  db.prepare("DELETE FROM memory_relationships").run();
  db.prepare("DELETE FROM memory_audit").run();
  db.prepare("DELETE FROM memories").run();
  db.prepare("DELETE FROM message_revisions").run();
  db.prepare("DELETE FROM messages").run();
  db.prepare("DELETE FROM conversations").run();

  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO conversations (
      id,
      title,
      timezone,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    "test-conversation-1",
    "Persistence Tests",
    "Asia/Kolkata",
    now,
    now,
  );

  db.prepare(`
    INSERT INTO messages (
      id,
      conversation_id,
      role,
      content,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    "test-message-1",
    "test-conversation-1",
    "user",
    "I am learning Rust.",
    now,
    now,
  );
});

afterEach(() => {
  // Remove the temporary trigger if a test created it.
  db.exec(`
    DROP TRIGGER IF EXISTS test_audit_failure;
  `);
});

describe("MemoryPersistenceService", () => {
  it("inserts a new memory into the database", () => {
    const result = service.persist([candidate]);

    expect(result.total).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.duplicates).toBe(0);

    const memory = db.prepare(`
      SELECT *
      FROM memories
      WHERE source_message_id = ?
    `).get("test-message-1");

    expect(memory).toBeDefined();
  });

  it("detects an existing duplicate memory", () => {
    service.persist([candidate]);

    const result = service.persist([candidate]);

    expect(result.total).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.duplicates).toBe(1);
    expect(result.results[0].action).toBe("duplicate");
  });

  it("detects duplicates despite capitalization and whitespace differences", () => {
    service.persist([candidate]);

    const duplicateCandidate: ResolvedMemoryCandidate = {
      ...candidate,
      content: "  THE USER IS LEARNING RUST.  ",
    };

    const result = service.persist([duplicateCandidate]);

    expect(result.duplicates).toBe(1);
    expect(result.inserted).toBe(0);
  });

  it("creates an audit record when a memory is inserted", () => {
    const result = service.persist([candidate]);

    const audit = db.prepare(`
      SELECT *
      FROM memory_audit
      WHERE memory_id = ?
    `).get(result.results[0].memory_id) as
      | {
          action: string;
          proposed_content: string;
          source_message_id: string;
        }
      | undefined;

    expect(audit).toBeDefined();
    expect(audit?.action).toBe("accepted");
    expect(audit?.proposed_content).toBe(candidate.content);
    expect(audit?.source_message_id).toBe(
      candidate.source_message_id,
    );
  });

  it("does not create an audit record for a duplicate", () => {
    service.persist([candidate]);

    const result = service.persist([candidate]);

    expect(result.duplicates).toBe(1);

    const auditCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM memory_audit
    `).get() as { count: number };

    expect(auditCount.count).toBe(1);
  });

  it("rolls back memory insertion if audit insertion fails", () => {
    db.exec(`
      CREATE TRIGGER test_audit_failure
      BEFORE INSERT ON memory_audit
      BEGIN
        SELECT RAISE(ABORT, 'Simulated audit failure');
      END;
    `);

    expect(() => {
      service.persist([candidate]);
    }).toThrow("Simulated audit failure");

    const memoryCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM memories
    `).get() as { count: number };

    const auditCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM memory_audit
    `).get() as { count: number };

    expect(memoryCount.count).toBe(0);
    expect(auditCount.count).toBe(0);
  });

  it("returns an accurate summary for mixed candidates", () => {
    const secondCandidate: ResolvedMemoryCandidate = {
      ...candidate,
      content: "The user wants to become a systems engineer.",
      memory_type: "goal",
    };

    const result = service.persist([
      candidate,
      candidate,
      secondCandidate,
    ]);

    expect(result.total).toBe(3);
    expect(result.inserted).toBe(2);
    expect(result.duplicates).toBe(1);
    expect(result.superseded).toBe(0);
    expect(result.rejected).toBe(0);
    expect(result.results).toHaveLength(3);
  });
});
