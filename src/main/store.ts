import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { chats } from "./db/schema";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  parts: unknown[];
  sessionId?: string;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
}

export interface ChatEntry {
  id: string;
  workspacePath: string;
  name: string;
  sessionId: string | null;
  model?: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

type ChatRow = typeof chats.$inferSelect;

function rowToChatEntry(row: ChatRow): ChatEntry {
  return {
    id: row.id,
    workspacePath: row.workspacePath,
    name: row.name,
    sessionId: row.sessionId,
    model: row.model ?? undefined,
    messages: JSON.parse(row.messages) as StoredMessage[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listChats(workspacePath: string): ChatEntry[] {
  const rows = db
    .select()
    .from(chats)
    .where(eq(chats.workspacePath, workspacePath))
    .orderBy(desc(chats.updatedAt))
    .all();
  return rows.map(rowToChatEntry);
}

export function getChat(chatId: string): ChatEntry | null {
  const row = db.select().from(chats).where(eq(chats.id, chatId)).get();
  return row ? rowToChatEntry(row) : null;
}

export function createChat(id: string, workspacePath: string): ChatEntry {
  const now = new Date().toISOString();
  const entry = {
    id,
    workspacePath,
    name: "New chat",
    messages: "[]",
    createdAt: now,
    updatedAt: now,
  };
  db.insert(chats).values(entry).run();
  return {
    id,
    workspacePath,
    name: "New chat",
    sessionId: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function deleteChat(chatId: string): void {
  db.delete(chats).where(eq(chats.id, chatId)).run();
}

export function updateChatModel(chatId: string, model: string): void {
  db.update(chats)
    .set({ model, updatedAt: new Date().toISOString() })
    .where(eq(chats.id, chatId))
    .run();
}

export function saveMessages(
  chatId: string,
  messages: StoredMessage[],
  sessionId: string | null,
): void {
  const row = db
    .select({ name: chats.name })
    .from(chats)
    .where(eq(chats.id, chatId))
    .get();
  if (!row) return;

  let name = row.name;

  // Auto-name from first user message
  if (name === "New chat" && messages.length > 0) {
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser) {
      const textPart = firstUser.parts.find(
        (p): p is { type: "text"; text: string } =>
          typeof p === "object" && p !== null && "type" in p && p.type === "text",
      );
      if (textPart) {
        name = textPart.text.slice(0, 80);
      }
    }
  }

  db.update(chats)
    .set({
      messages: JSON.stringify(messages),
      sessionId,
      name,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chats.id, chatId))
    .run();
}
