import { SendHorizontal, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_MODEL, MODELS } from "../../../main/models";
import { useChat } from "../hooks/useChat";
import { trpc } from "../trpc";
import type { Workspace } from "../types";
import { MessageBubble } from "./MessageBubble";
import { ModelSelector } from "./ModelSelector";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

interface ChatPanelProps {
  workspace: Workspace;
  chatId: string;
}

export function ChatPanel({ workspace, chatId }: ChatPanelProps): React.JSX.Element {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const { messages, isStreaming, sendMessage, abort } = useChat({
    chatId,
    cwd: workspace.folderPath,
    model,
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted model from chat data
  useEffect(() => {
    trpc.claude.getChat
      .query({ chatId })
      .then((chat) => {
        if (chat?.model) setModel(chat.model);
      })
      .catch(() => {});
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

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

      <div className="shrink-0 px-4 py-3">
        <div className="mx-auto max-w-3xl flex flex-col gap-2 border p-2 rounded-md">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              className="max-h-32 min-h-[36px] border-none resize-none shadow-none focus-visible:ring-0"
              placeholder="Message Claude..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          <div className="flex items-center gap-2 justify-between">
            <ModelSelector
              models={MODELS}
              value={model}
              onValueChange={(value) => {
                setModel(value);
                trpc.claude.updateChatModel
                  .mutate({ chatId, model: value })
                  .catch(() => {});
              }}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button variant="outline" size="icon-sm" onClick={abort} title="Stop">
                <Square className="size-3.5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={handleSubmit}
                disabled={!input.trim()}
                title="Send"
              >
                <SendHorizontal className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
