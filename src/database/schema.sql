
PRAGMA foreign_keys = ON;

-- 1. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New conversation',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. Messages
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

-- 3. Message revisions
-- Stores previous versions when a message is edited.
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

-- Indexes for common retrieval operations
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_active
ON messages(conversation_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_revisions_message
ON message_revisions(message_id, revision_number);
