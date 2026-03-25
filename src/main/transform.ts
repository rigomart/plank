import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { ChatChunk } from './types'

export function createTransformer() {
  let textStarted = false

  return function* transform(msg: SDKMessage): Generator<ChatChunk> {
    if (msg.type === 'stream_event') {
      const event = msg.event
      if (!event) return

      if (event.type === 'content_block_start' && event.content_block?.type === 'text') {
        textStarted = true
        yield { type: 'text-start' }
      } else if (
        event.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta' &&
        event.delta.text
      ) {
        yield { type: 'text-delta', delta: event.delta.text }
      } else if (event.type === 'content_block_stop' && textStarted) {
        textStarted = false
        yield { type: 'text-end' }
      }
    } else if (msg.type === 'result') {
      yield {
        type: 'finish',
        sessionId: msg.session_id ?? '',
        usage: msg.usage
          ? {
              inputTokens: msg.usage.input_tokens ?? 0,
              outputTokens: msg.usage.output_tokens ?? 0
            }
          : undefined,
        costUsd: msg.total_cost_usd ?? undefined
      }
    }
  }
}
