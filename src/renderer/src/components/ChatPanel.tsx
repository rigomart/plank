import { Loader2, SendHorizontal, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import type { Workspace } from '../types'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'

interface ChatPanelProps {
  workspace: Workspace
  chatId: string
}

export function ChatPanel({ workspace, chatId }: ChatPanelProps): React.JSX.Element {
  const { messages, isStreaming, sendMessage, abort } = useChat({
    chatId,
    cwd: workspace.folderPath
  })
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 pt-32">
              <span className="text-sm font-medium text-card-foreground/60">
                Start a conversation
              </span>
              <span className="text-xs text-muted-foreground">
                Ask Claude to help with your project
              </span>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    msg.role === 'user'
                      ? 'max-w-[85%] rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground'
                      : 'max-w-[85%] text-sm text-card-foreground'
                  }
                >
                  {msg.role === 'assistant' && !msg.content && isStreaming ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={inputRef}
            className="max-h-32 min-h-[36px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-card-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring"
            placeholder="Message Claude..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {isStreaming ? (
            <Button variant="outline" size="icon-sm" onClick={abort} title="Stop">
              <Square className="size-3.5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleSubmit}
              disabled={!input.trim()}
              title="Send"
            >
              <SendHorizontal className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
