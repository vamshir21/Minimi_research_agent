
import { randomUUID } from "node:crypto";
import db from "../../database/connection.js";
import type { CreateConversationInput } from "./conversation.schemas.js";

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
