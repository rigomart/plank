import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../../trpc";
import type { Workspace } from "../../types";
import { ChatList } from "./chat-list";

interface ChatSidebarProps {
  workspace: Workspace;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  workspace,
  activeChatId,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const queryKey = ["chats", workspace.folderPath, activeChatId];

  const { data: chats = [] } = useQuery({
    queryKey,
    queryFn: () =>
      trpc.claude.listChats
        .query({ workspacePath: workspace.folderPath })
        .then((list) =>
          list.map((c) => ({ id: c.id, name: c.name, updatedAt: c.updatedAt })),
        ),
  });

  const handleDelete = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trpc.claude.deleteChat.mutate({ chatId }).then(() => {
      queryClient.invalidateQueries({ queryKey });
      if (chatId === activeChatId) {
        onNewChat();
      }
    });
  };

  return (
    <ChatList
      chats={chats}
      activeChatId={activeChatId}
      onSelectChat={onSelectChat}
      onDeleteChat={handleDelete}
      onNewChat={onNewChat}
    />
  );
}
