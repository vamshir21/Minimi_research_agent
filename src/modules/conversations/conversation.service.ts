
import { randomUUID } from "node:crypto";
import db from "../../database/connection.js";
import type { CreateConversationInput,CreateMessageInput } from "./conversation.schemas.js";

export interface Conversation {
  id: string;
  title: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export function createConversation(
  input: CreateConversationInput
): Conversation {
  const id = randomUUID();
  const now = new Date().toISOString();

  const title = input.title ?? "New conversation";

  db.prepare(`
    INSERT INTO conversations (
      id,
      title,
      timezone,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title, input.timezone, now, now);

  const conversation = db.prepare(`
    SELECT *
    FROM conversations
    WHERE id = ?
  `).get(id) as Conversation | undefined;

  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  return conversation;
}


export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function createMessage(
  conversationId: string,
  input: CreateMessageInput
): Message {
  // 1. Verify that the conversation exists
  const conversation = db.prepare(`
    SELECT id
    FROM conversations
    WHERE id = ?
  `).get(conversationId);

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  // 2. Generate message metadata
  const id = randomUUID();
  const now = new Date().toISOString();

  // 3. Persist the message
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
    id,
    conversationId,
    "user",
    input.content,
    now,
    now
  );

  // 4. Retrieve the persisted record
  const message = db.prepare(`
    SELECT *
    FROM messages
    WHERE id = ?
  `).get(id) as Message | undefined;

  if (!message) {
    throw new Error("MESSAGE_CREATION_FAILED");
  }

  return message;
}

export function getConversationMessages(
  conversationId: string
): Message[] {
  const conversation = db.prepare(`
    SELECT id
    FROM conversations
    WHERE id = ?
  `).get(conversationId);

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const messages = db.prepare(`
    SELECT *
    FROM messages
    WHERE conversation_id = ?
      AND deleted_at IS NULL
    ORDER BY created_at ASC, rowid ASC
  `).all(conversationId) as Message[];

  return messages;
}