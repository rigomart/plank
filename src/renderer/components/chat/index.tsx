import { useEffect, useState } from "react";
import { DEFAULT_MODEL, MODELS } from "../../../main/models";
import { useChat } from "../../hooks/useChat";
import { trpc } from "../../trpc";
import type { Workspace } from "../../types";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

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

  useEffect(() => {
    trpc.claude.getChat
      .query({ chatId })
      .then((chat) => {
        if (chat?.model) setModel(chat.model);
      })
      .catch(() => {});
  }, [chatId]);

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      <MessageList messages={messages} isStreaming={isStreaming} />
      <ChatInput
        models={MODELS}
        model={model}
        onModelChange={(value) => {
          setModel(value);
          trpc.claude.updateChatModel.mutate({ chatId, model: value }).catch(() => {});
        }}
        isStreaming={isStreaming}
        onSubmit={sendMessage}
        onAbort={abort}
      />
    </main>
  );
}
