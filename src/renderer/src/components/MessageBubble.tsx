import { Loader2 } from 'lucide-react'
import type { ChatMessage } from '../types'
import { ToolCallCard } from './ToolCallCard'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps): React.JSX.Element {
  const isUser = message.role === 'user'
  const isEmpty = message.parts.length === 0

  if (isUser) {
    const text = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('')

    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground">
          <div className="whitespace-pre-wrap break-words">{text}</div>
        </div>
      </div>
    )
  }

  // Assistant message
  if (isEmpty && isStreaming) {
    return (
      <div className="flex justify-start">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span className="text-xs">Thinking...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2 text-sm text-card-foreground">
        {message.parts.map((part) => {
          if (part.type === 'text') {
            return (
              <div key={part.id} className="whitespace-pre-wrap break-words">
                {part.text}
              </div>
            )
          }

          return (
            <ToolCallCard
              key={part.toolCallId}
              toolName={part.toolName}
              toolCallId={part.toolCallId}
              input={part.input}
              output={part.output}
              error={part.error}
              state={part.state}
            />
          )
        })}
      </div>
    </div>
  )
}
