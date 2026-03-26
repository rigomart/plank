import { existsSync, readFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app } from "electron";
import * as schema from "./schema";

const DB_PATH = join(app.getPath("userData"), "plank.db");
const OLD_CHATS_FILE = join(app.getPath("userData"), "chats.json");

function getMigrationsFolder(): string {
  // In production, resources are in process.resourcesPath
  // In dev, they're relative to the project root
  if (app.isPackaged) {
    return join(process.resourcesPath, "migrations");
  }
  return join(app.getAppPath(), "resources/migrations");
}

function createDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  // Run Drizzle migrations (creates tables on first run, applies schema changes on updates)
  migrate(db, { migrationsFolder: getMigrationsFolder() });

  // One-time migration from legacy chats.json
  migrateFromJson(sqlite);

  return db;
}

interface OldChatEntry {
  id: string;
  workspacePath: string;
  name: string;
  sessionId: string | null;
  model?: string;
  messages: unknown[];
  createdAt: string;
  updatedAt: string;
}

function migrateFromJson(sqlite: Database.Database): void {
  if (!existsSync(OLD_CHATS_FILE)) return;

  try {
    const raw = JSON.parse(readFileSync(OLD_CHATS_FILE, "utf-8"));
    const oldChats: OldChatEntry[] = raw.chats ?? [];

    const insert = sqlite.prepare(`
      INSERT OR IGNORE INTO chats
        (id, workspace_path, name, session_id, model, messages, created_at, updated_at)
      VALUES
        (@id, @workspacePath, @name, @sessionId, @model, @messages, @createdAt, @updatedAt)
    `);

    const runMigration = sqlite.transaction((entries: OldChatEntry[]) => {
      for (const chat of entries) {
        insert.run({
          id: chat.id,
          workspacePath: chat.workspacePath,
          name: chat.name,
          sessionId: chat.sessionId ?? null,
          model: chat.model ?? null,
          messages: JSON.stringify(chat.messages ?? []),
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        });
      }
    });

    runMigration(oldChats);
    renameSync(OLD_CHATS_FILE, `${OLD_CHATS_FILE}.migrated`);
  } catch {
    // Migration failed — old file stays in place, next startup will retry
  }
}

export const db = createDb();
