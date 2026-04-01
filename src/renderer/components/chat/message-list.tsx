import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import { MessageErrorBoundary } from "../error-boundary";
import { ScrollArea } from "../ui/scroll-area";
import { EmptyState } from "./empty-state";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({
  messages,
  isStreaming,
}: MessageListProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6">
        {messages.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description="Ask Claude to help with your project"
          />
        ) : (
          messages.map((msg) => (
            <MessageErrorBoundary key={msg.id}>
              <MessageBubble
                message={msg}
                isStreaming={isStreaming && msg === messages[messages.length - 1]}
              />
            </MessageErrorBoundary>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
