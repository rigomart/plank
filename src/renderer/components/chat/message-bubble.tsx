import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";
import type { ChatMessage, ErrorCategory } from "../../types";
import { LoadingGrid } from "../ui/loading-grid";
import { MessageActions } from "./message-actions";
import { SubagentCard } from "./subagent-card";
import { ThinkingBlock } from "./thinking-block";
import { ToolCallCard } from "./tool-call-card";

const plugins = { code };

const ERROR_HINTS: Record<ErrorCategory, string> = {
  auth: "Run `claude login` in your terminal to authenticate.",
  "rate-limit": "You have hit the rate limit. Wait a moment and try again.",
  overloaded: "Claude is currently overloaded. Try again shortly.",
  network: "Could not connect. Check your internet connection.",
  generic: "",
};

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming: boolean;
}

export function MessageBubble({
  message,
  isStreaming,
}: MessageBubbleProps): React.JSX.Element {
  const isUser = message.role === "user";
  const isEmpty = message.parts.length === 0;

  if (isUser) {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");

    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-sm bg-secondary px-3 py-1.5 text-md text-secondary-foreground border border-primary/5">
          <div className="whitespace-pre-wrap wrap-break-word">{text}</div>
        </div>
      </div>
    );
  }

  // Assistant message
  if (isEmpty && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 px-1.5 py-1">
        <LoadingGrid className="size-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Thinking...</span>
      </div>
    );
  }

  return (
    <div className="flex w-full">
      <div className="w-[85%] space-y-2 text-sm text-card-foreground">
        {message.parts.map((part) => {
          if (part.type === "thinking") {
            return (
              <ThinkingBlock
                key={part.id}
                text={part.text}
                isStreaming={part.isStreaming}
              />
            );
          }

          if (part.type === "text") {
            return (
              <div className="px-2">
                <Streamdown key={part.id} plugins={plugins} isAnimating={isStreaming}>
                  {part.text}
                </Streamdown>
              </div>
            );
          }

          if (part.children) {
            return (
              <SubagentCard
                key={part.toolCallId}
                toolCallId={part.toolCallId}
                description={part.subagentDescription}
                status={part.subagentStatus}
                input={part.input}
              >
                {part.children}
              </SubagentCard>
            );
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
          );
        })}
        {message.error && (
          <div className="px-1.5 py-1.5 text-xs">
            <span className="text-destructive">{message.error.message}</span>
            {ERROR_HINTS[message.error.category] && (
              <span className="ml-1 text-muted-foreground">
                {ERROR_HINTS[message.error.category]}
              </span>
            )}
          </div>
        )}
        {!isStreaming && <MessageActions message={message} />}
      </div>
    </div>
  );
}
