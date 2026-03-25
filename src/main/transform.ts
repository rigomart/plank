import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { ChatChunk } from './types'

export function createTransformer() {
  let textStarted = false
  let currentToolCallId: string | null = null
  let currentToolName: string | null = null
  let accumulatedToolInput = ''
  const emittedToolIds = new Set<string>()

  return function* transform(msg: SDKMessage): Generator<ChatChunk> {
    if (msg.type === 'stream_event') {
      const event = msg.event
      if (!event) return

      if (event.type === 'content_block_start') {
        const block = event.content_block
        if (!block) return

        if (block.type === 'text') {
          textStarted = true
          yield { type: 'text-start' }
        } else if (block.type === 'tool_use') {
          currentToolCallId = block.id
          currentToolName = block.name
          accumulatedToolInput = ''
          emittedToolIds.add(block.id)
          yield { type: 'tool-input-start', toolCallId: block.id, toolName: block.name }
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta
        if (!delta) return

        if (delta.type === 'text_delta' && delta.text) {
          yield { type: 'text-delta', delta: delta.text }
        } else if (delta.type === 'input_json_delta' && currentToolCallId) {
          const text = (delta as { partial_json?: string }).partial_json ?? ''
          if (text) {
            accumulatedToolInput += text
            yield { type: 'tool-input-delta', toolCallId: currentToolCallId, delta: text }
          }
        }
      } else if (event.type === 'content_block_stop') {
        if (textStarted) {
          textStarted = false
          yield { type: 'text-end' }
        } else if (currentToolCallId && currentToolName) {
          let parsed: unknown = accumulatedToolInput
          try {
            parsed = JSON.parse(accumulatedToolInput)
          } catch {}
          yield {
            type: 'tool-input-available',
            toolCallId: currentToolCallId,
            toolName: currentToolName,
            input: parsed
          }
          currentToolCallId = null
          currentToolName = null
          accumulatedToolInput = ''
        }
      }
    } else if (msg.type === 'assistant') {
      // Emit any tool_use blocks not already streamed (dedup)
      const content = msg.message?.content
      if (!Array.isArray(content)) return

      for (const block of content) {
        if (block.type === 'tool_use' && !emittedToolIds.has(block.id)) {
          emittedToolIds.add(block.id)
          yield {
            type: 'tool-input-available',
            toolCallId: block.id,
            toolName: block.name,
            input: block.input
          }
        }
      }
    } else if (msg.type === 'user') {
      // Tool results come in user messages
      const content = msg.message?.content
      if (!Array.isArray(content)) return

      for (const block of content) {
        if (block.type !== 'tool_result') continue

        const isError = block.is_error === true
        const text = extractToolResultText(block.content)

        if (isError) {
          yield { type: 'tool-output-error', toolCallId: block.tool_use_id, error: text }
        } else {
          yield { type: 'tool-output-available', toolCallId: block.tool_use_id, output: text }
        }
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

function extractToolResultText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === 'string') return c
        if (c && typeof c === 'object' && 'text' in c) return String(c.text)
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}
