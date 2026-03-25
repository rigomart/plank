export interface RepoInfo {
  owner: string
  repo: string
  fullName: string
}

export interface WorkspaceEntry {
  folderPath: string
  repo: RepoInfo | null
  addedAt: string
}

export interface Workspace {
  folderPath: string
  repo: RepoInfo | null
}

export type ToolCallState = 'streaming-input' | 'running' | 'done' | 'error'

export type MessagePart =
  | { type: 'text'; id: string; text: string }
  | { type: 'thinking'; id: string; text: string; isStreaming: boolean }
  | {
      type: 'tool-call'
      toolCallId: string
      toolName: string
      input: string
      output?: string
      error?: string
      state: ToolCallState
    }

export type ErrorCategory = 'auth' | 'rate-limit' | 'overloaded' | 'network' | 'generic'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  parts: MessagePart[]
  sessionId?: string
  usage?: { inputTokens: number; outputTokens: number }
  costUsd?: number
  durationMs?: number
  error?: { message: string; category: ErrorCategory }
}
