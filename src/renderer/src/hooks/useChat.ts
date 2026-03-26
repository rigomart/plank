import { useCallback, useEffect, useRef, useState } from 'react'
import { trpc } from '../trpc'
import type { ChatMessage, MessagePart } from '../types'

interface UseChatOptions {
  chatId: string
  cwd: string
  model?: string
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

export function useChat({ chatId, cwd, model }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const unsubRef = useRef<{ unsubscribe: () => void } | null>(null)
  const sessionIdRef = useRef<string | undefined>(undefined)
  const messagesRef = useRef<ChatMessage[]>([])

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Load existing messages from persistence
  useEffect(() => {
    setIsLoading(true)
    trpc.claude.getChat
      .query({ chatId })
      .then((chat) => {
        if (chat?.messages?.length) {
          setMessages(chat.messages as ChatMessage[])
          const lastAssistant = [...chat.messages].reverse().find((m) => m.role === 'assistant')
          if (lastAssistant?.sessionId) {
            sessionIdRef.current = lastAssistant.sessionId
          }
          if (chat.sessionId) {
            sessionIdRef.current = chat.sessionId
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [chatId])

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

      // Read current messages from ref (avoids side effects inside state updater)
      const currentMessages = messagesRef.current

      // Update state first (pure)
      setMessages([...currentMessages, userMsg, assistantMsg])
      setIsStreaming(true)

      // Then subscribe (side effect, outside state updater)
      unsubRef.current = trpc.claude.chat.subscribe(
        {
          chatId,
          prompt: text.trim(),
          cwd,
          sessionId: sessionIdRef.current,
          model,
          messages: currentMessages
        },
        {
          onData(chunk) {
            switch (chunk.type) {
              case 'thinking-start':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: [
                      ...m.parts,
                      { type: 'thinking', id: crypto.randomUUID(), text: '', isStreaming: true }
                    ]
                  }))
                )
                break

              case 'thinking-delta':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((p) =>
                      p.type === 'thinking' && p.isStreaming
                        ? { ...p, text: p.text + chunk.delta }
                        : p
                    )
                  }))
                )
                break

              case 'thinking-end':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((p) =>
                      p.type === 'thinking' && p.isStreaming ? { ...p, isStreaming: false } : p
                    )
                  }))
                )
                break

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
                    parts: m.parts.map((part) =>
                      part.type === 'tool-call' && part.toolCallId === chunk.toolCallId
                        ? { ...part, input: part.input + chunk.delta }
                        : part
                    )
                  }))
                )
                break

              case 'tool-input-available':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => {
                    const exists = m.parts.some(
                      (part) => part.type === 'tool-call' && part.toolCallId === chunk.toolCallId
                    )
                    if (exists) {
                      return {
                        ...m,
                        parts: m.parts.map((part) =>
                          part.type === 'tool-call' && part.toolCallId === chunk.toolCallId
                            ? {
                                ...part,
                                input: JSON.stringify(chunk.input, null, 2),
                                state: 'running' as const
                              }
                            : part
                        )
                      }
                    }
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
                    parts: m.parts.map((part) =>
                      part.type === 'tool-call' && part.toolCallId === chunk.toolCallId
                        ? { ...part, output: chunk.output, state: 'done' as const }
                        : part
                    )
                  }))
                )
                break

              case 'tool-output-error':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((part) =>
                      part.type === 'tool-call' && part.toolCallId === chunk.toolCallId
                        ? { ...part, error: chunk.error, state: 'error' as const }
                        : part
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
                    costUsd: chunk.costUsd,
                    durationMs: chunk.durationMs
                  }))
                )
                setIsStreaming(false)
                unsubRef.current = null
                break

              case 'error':
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    error: { message: chunk.message, category: chunk.category },
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
    [chatId, cwd, isStreaming, model]
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

  return { messages, isStreaming, isLoading, sendMessage, abort, reset }
}
