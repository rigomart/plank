import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

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
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreaming && msg === messages[messages.length - 1]}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
