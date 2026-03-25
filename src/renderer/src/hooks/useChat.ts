import { useCallback, useRef, useState } from 'react'
import { trpc } from '../trpc'
import type { ChatMessage, MessagePart } from '../types'

interface UseChatOptions {
  chatId: string
  cwd: string
}

function updateLastAssistant(
  prev: ChatMessage[],
  assistantId: string,
  updater: (msg: ChatMessage) => ChatMessage
): ChatMessage[] {
  return prev.map((m) => (m.id === assistantId ? updater(m) : m))
}

function appendText(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts[parts.length - 1]
  if (last?.type === 'text') {
    return [...parts.slice(0, -1), { ...last, text: last.text + delta }]
  }
  return [...parts, { type: 'text', id: crypto.randomUUID(), text: delta }]
}

export function useChat({ chatId, cwd }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const unsubRef = useRef<{ unsubscribe: () => void } | null>(null)
  const sessionIdRef = useRef<string | undefined>(undefined)

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isStreaming) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', id: crypto.randomUUID(), text: text.trim() }]
      }

      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        parts: []
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      unsubRef.current = trpc.claude.chat.subscribe(
        {
          chatId,
          prompt: text.trim(),
          cwd,
          sessionId: sessionIdRef.current
        },
        {
          onData(chunk) {
            switch (chunk.type) {
              case 'text-delta':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: appendText(m.parts, chunk.delta)
                  }))
                )
                break

              case 'tool-input-start':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: [
                      ...m.parts,
                      {
                        type: 'tool-call',
                        toolCallId: chunk.toolCallId,
                        toolName: chunk.toolName,
                        input: '',
                        state: 'streaming-input'
                      }
                    ]
                  }))
                )
                break

              case 'tool-input-delta':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((p) =>
                      p.type === 'tool-call' && p.toolCallId === chunk.toolCallId
                        ? { ...p, input: p.input + chunk.delta }
                        : p
                    )
                  }))
                )
                break

              case 'tool-input-available':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => {
                    const exists = m.parts.some(
                      (p) => p.type === 'tool-call' && p.toolCallId === chunk.toolCallId
                    )
                    if (exists) {
                      return {
                        ...m,
                        parts: m.parts.map((p) =>
                          p.type === 'tool-call' && p.toolCallId === chunk.toolCallId
                            ? {
                                ...p,
                                input: JSON.stringify(chunk.input, null, 2),
                                state: 'running' as const
                              }
                            : p
                        )
                      }
                    }
                    // Tool wasn't streamed progressively, add it now
                    return {
                      ...m,
                      parts: [
                        ...m.parts,
                        {
                          type: 'tool-call' as const,
                          toolCallId: chunk.toolCallId,
                          toolName: chunk.toolName,
                          input: JSON.stringify(chunk.input, null, 2),
                          state: 'running' as const
                        }
                      ]
                    }
                  })
                )
                break

              case 'tool-output-available':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((p) =>
                      p.type === 'tool-call' && p.toolCallId === chunk.toolCallId
                        ? { ...p, output: chunk.output, state: 'done' as const }
                        : p
                    )
                  }))
                )
                break

              case 'tool-output-error':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((p) =>
                      p.type === 'tool-call' && p.toolCallId === chunk.toolCallId
                        ? { ...p, error: chunk.error, state: 'error' as const }
                        : p
                    )
                  }))
                )
                break

              case 'finish':
                sessionIdRef.current = chunk.sessionId
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    sessionId: chunk.sessionId,
                    usage: chunk.usage,
                    costUsd: chunk.costUsd
                  }))
                )
                setIsStreaming(false)
                unsubRef.current = null
                break

              case 'error':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts:
                      m.parts.length > 0
                        ? m.parts
                        : [
                            {
                              type: 'text',
                              id: crypto.randomUUID(),
                              text: `Error: ${chunk.message}`
                            }
                          ]
                  }))
                )
                setIsStreaming(false)
                unsubRef.current = null
                break
            }
          },
          onError(err) {
            setMessages((prev) =>
              updateLastAssistant(prev, assistantId, (m) => ({
                ...m,
                parts:
                  m.parts.length > 0
                    ? m.parts
                    : [{ type: 'text', id: crypto.randomUUID(), text: `Error: ${err.message}` }]
              }))
            )
            setIsStreaming(false)
            unsubRef.current = null
          }
        }
      )
    },
    [chatId, cwd, isStreaming]
  )

  const abort = useCallback(() => {
    unsubRef.current?.unsubscribe()
    unsubRef.current = null
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    abort()
    setMessages([])
    sessionIdRef.current = undefined
  }, [abort])

  return { messages, isStreaming, sendMessage, abort, reset }
}
