export interface Usage {
  inputTokens: number
  outputTokens: number
}

export type ChatChunk =
  | { type: 'text-start' }
  | { type: 'text-delta'; delta: string }
  | { type: 'text-end' }
  | { type: 'finish'; sessionId: string; usage?: Usage; costUsd?: number }
  | { type: 'error'; message: string }
