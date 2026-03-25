import { buildClaudeEnv } from './env'
import { createTransformer } from './transform'
import type { ChatChunk } from './types'

type ClaudeQuery = typeof import('@anthropic-ai/claude-agent-sdk').query
let cachedQuery: ClaudeQuery | null = null

async function getClaudeQuery(): Promise<ClaudeQuery> {
  if (cachedQuery) return cachedQuery
  const sdk = await import('@anthropic-ai/claude-agent-sdk')
  cachedQuery = sdk.query
  return cachedQuery
}

const activeSessions = new Map<string, AbortController>()
const sessionIds = new Map<string, string>()

export interface ChatInput {
  chatId: string
  prompt: string
  cwd: string
  sessionId?: string
}

export async function* streamChat(
  input: ChatInput,
  signal?: AbortSignal
): AsyncGenerator<ChatChunk> {
  // Abort existing session for this chat (race condition prevention)
  const existing = activeSessions.get(input.chatId)
  if (existing) existing.abort()

  const abortController = new AbortController()
  activeSessions.set(input.chatId, abortController)

  // Wire up external abort signal
  signal?.addEventListener('abort', () => abortController.abort())

  const sessionId = input.sessionId ?? sessionIds.get(input.chatId)

  try {
    const claudeQuery = await getClaudeQuery()
    const env = buildClaudeEnv()

    const stream = claudeQuery({
      prompt: input.prompt,
      options: {
        cwd: input.cwd,
        abortController,
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        env,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        includePartialMessages: true,
        // Resume existing session, or start fresh (no continue = new session)
        ...(sessionId ? { resume: sessionId, continue: true } : {})
      }
    })

    const transform = createTransformer()

    for await (const msg of stream) {
      if (abortController.signal.aborted) break

      for (const chunk of transform(msg)) {
        yield chunk

        // Track session ID from finish chunks
        if (chunk.type === 'finish' && chunk.sessionId) {
          sessionIds.set(input.chatId, chunk.sessionId)
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const lower = msg.toLowerCase()
    const category = lower.includes('abort')
      ? ('generic' as const)
      : lower.includes('enoent') || lower.includes('not found')
        ? ('auth' as const)
        : ('generic' as const)
    yield { type: 'error' as const, message: msg, category }
  } finally {
    activeSessions.delete(input.chatId)
  }
}

export function abortAllSessions(): void {
  for (const controller of activeSessions.values()) {
    controller.abort()
  }
  activeSessions.clear()
}
