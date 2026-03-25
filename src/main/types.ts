export interface Usage {
  inputTokens: number
  outputTokens: number
}

export type ErrorCategory = 'auth' | 'rate-limit' | 'overloaded' | 'network' | 'generic'

export type ChatChunk =
  // Text streaming
  | { type: 'text-start' }
  | { type: 'text-delta'; delta: string }
  | { type: 'text-end' }
  // Tool calls
  | { type: 'tool-input-start'; toolCallId: string; toolName: string }
  | { type: 'tool-input-delta'; toolCallId: string; delta: string }
  | { type: 'tool-input-available'; toolCallId: string; toolName: string; input: unknown }
  | { type: 'tool-output-available'; toolCallId: string; output: string }
  | { type: 'tool-output-error'; toolCallId: string; error: string }
  // Lifecycle
  | { type: 'finish'; sessionId: string; usage?: Usage; costUsd?: number; durationMs?: number }
  | { type: 'error'; message: string; category: ErrorCategory }
