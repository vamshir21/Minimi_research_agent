
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New conversation',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('user', 'assistant', 'system', 'tool')
    ),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_revisions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    revision_number INTEGER NOT NULL CHECK (revision_number > 0),
    content TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (message_id)
        REFERENCES messages(id)
        ON DELETE CASCADE,
    UNIQUE (message_id, revision_number)
);

CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    memory_type TEXT NOT NULL CHECK (
        memory_type IN ('fact','preference','goal','decision','instruction','context')
    ),
    origin TEXT NOT NULL CHECK (origin IN ('explicit','inferred')),
    confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    status TEXT NOT NULL DEFAULT 'current' CHECK (
        status IN ('current','tentative','superseded','disputed','expired')
    ),
    source_message_id TEXT NOT NULL,
    extracted_at TEXT NOT NULL,
    valid_from TEXT,
    valid_until TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (source_message_id)
        REFERENCES messages(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS memory_audit (
    id TEXT PRIMARY KEY,
    memory_id TEXT,
    source_message_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (
        action IN ('proposed','accepted','rejected','updated','superseded')
    ),
    proposed_content TEXT NOT NULL,
    reason TEXT,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (memory_id)
        REFERENCES memories(id) ON DELETE SET NULL,
    FOREIGN KEY (source_message_id)
        REFERENCES messages(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS memory_relationships (
    id TEXT PRIMARY KEY,
    source_memory_id TEXT NOT NULL,
    target_memory_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (
        relationship_type IN ('supports','contradicts','supersedes','related_to')
    ),
    created_at TEXT NOT NULL,
    CHECK (source_memory_id <> target_memory_id),
    UNIQUE (source_memory_id, target_memory_id, relationship_type),
    FOREIGN KEY (source_memory_id)
        REFERENCES memories(id) ON DELETE CASCADE,
    FOREIGN KEY (target_memory_id)
        REFERENCES memories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memories_status_extracted
ON memories(status, extracted_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_source_message
ON memories(source_message_id);
