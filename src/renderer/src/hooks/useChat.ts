import { useCallback, useRef, useState } from 'react'
import { trpc } from '../trpc'
import type { ChatMessage } from '../types'

interface UseChatOptions {
  chatId: string
  cwd: string
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
        content: text.trim()
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: ''
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      const assistantId = assistantMsg.id

      unsubRef.current = trpc.claude.chat.subscribe(
        {
          chatId,
          prompt: text.trim(),
          cwd,
          sessionId: sessionIdRef.current
        },
        {
          onData(chunk) {
            if (chunk.type === 'text-delta') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + chunk.delta } : m
                )
              )
            } else if (chunk.type === 'finish') {
              sessionIdRef.current = chunk.sessionId
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        sessionId: chunk.sessionId,
                        usage: chunk.usage,
                        costUsd: chunk.costUsd
                      }
                    : m
                )
              )
              setIsStreaming(false)
              unsubRef.current = null
            } else if (chunk.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content || `Error: ${chunk.message}` }
                    : m
                )
              )
              setIsStreaming(false)
              unsubRef.current = null
            }
          },
          onError(err) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content || `Error: ${err.message}` } : m
              )
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
