import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

const CHATS_FILE = join(app.getPath('userData'), 'chats.json')

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  parts: unknown[]
  sessionId?: string
  usage?: { inputTokens: number; outputTokens: number }
  costUsd?: number
}

export interface ChatEntry {
  id: string
  workspacePath: string
  name: string
  sessionId: string | null
  model?: string
  messages: StoredMessage[]
  createdAt: string
  updatedAt: string
}

interface ChatStore {
  chats: ChatEntry[]
}

function load(): ChatStore {
  if (!existsSync(CHATS_FILE)) return { chats: [] }
  try {
    const raw = JSON.parse(readFileSync(CHATS_FILE, 'utf-8'))
    return { chats: raw.chats ?? [] }
  } catch {
    return { chats: [] }
  }
}

function save(store: ChatStore): void {
  writeFileSync(CHATS_FILE, JSON.stringify(store, null, 2))
}

export function listChats(workspacePath: string): ChatEntry[] {
  const store = load()
  return store.chats
    .filter((c) => c.workspacePath === workspacePath)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getChat(chatId: string): ChatEntry | null {
  const store = load()
  return store.chats.find((c) => c.id === chatId) ?? null
}

export function createChat(id: string, workspacePath: string): ChatEntry {
  const store = load()
  const entry: ChatEntry = {
    id,
    workspacePath,
    name: 'New chat',
    sessionId: null,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  store.chats.push(entry)
  save(store)
  return entry
}

export function deleteChat(chatId: string): void {
  const store = load()
  store.chats = store.chats.filter((c) => c.id !== chatId)
  save(store)
}

export function updateChatModel(chatId: string, model: string): void {
  const store = load()
  const chat = store.chats.find((c) => c.id === chatId)
  if (!chat) return
  chat.model = model
  chat.updatedAt = new Date().toISOString()
  save(store)
}

export function saveMessages(
  chatId: string,
  messages: StoredMessage[],
  sessionId: string | null
): void {
  const store = load()
  const chat = store.chats.find((c) => c.id === chatId)
  if (!chat) return

  chat.messages = messages
  chat.sessionId = sessionId
  chat.updatedAt = new Date().toISOString()

  // Auto-name from first user message
  if (chat.name === 'New chat' && messages.length > 0) {
    const firstUser = messages.find((m) => m.role === 'user')
    if (firstUser) {
      const textPart = firstUser.parts.find(
        (p): p is { type: 'text'; text: string } =>
          typeof p === 'object' && p !== null && 'type' in p && p.type === 'text'
      )
      if (textPart) {
        chat.name = textPart.text.slice(0, 80)
      }
    }
  }

  save(store)
}
