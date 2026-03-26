import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable(
  "chats",
  {
    id: text("id").primaryKey(),
    workspacePath: text("workspace_path").notNull(),
    name: text("name").notNull().default("New chat"),
    sessionId: text("session_id"),
    model: text("model"),
    messages: text("messages").notNull().default("[]"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_chats_workspace_updated").on(table.workspacePath, table.updatedAt),
  ],
);
