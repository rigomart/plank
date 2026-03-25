import { code } from '@streamdown/code'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Streamdown } from 'streamdown'
import type { ChatMessage, ErrorCategory } from '../types'
import { MessageMetadata } from './MessageMetadata'
import { ThinkingBlock } from './ThinkingBlock'
import { ToolCallCard } from './ToolCallCard'

const plugins = { code }

const ERROR_HINTS: Record<ErrorCategory, string> = {
  auth: 'Run `claude login` in your terminal to authenticate.',
  'rate-limit': 'You have hit the rate limit. Wait a moment and try again.',
  overloaded: 'Claude is currently overloaded. Try again shortly.',
  network: 'Could not connect. Check your internet connection.',
  generic: ''
}

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
          if (part.type === 'thinking') {
            return <ThinkingBlock key={part.id} text={part.text} isStreaming={part.isStreaming} />
          }

          if (part.type === 'text') {
            return (
              <Streamdown key={part.id} plugins={plugins} isAnimating={isStreaming}>
                {part.text}
              </Streamdown>
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
        {message.error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
            <div className="text-xs">
              <div className="font-medium text-destructive">{message.error.message}</div>
              {ERROR_HINTS[message.error.category] && (
                <div className="mt-0.5 text-muted-foreground">
                  {ERROR_HINTS[message.error.category]}
                </div>
              )}
            </div>
          </div>
        )}
        {!isStreaming && <MessageMetadata message={message} />}
      </div>
    </div>
  )
}
