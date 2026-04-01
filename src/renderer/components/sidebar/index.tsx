import { useQueries, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../../trpc";
import type { WorkspaceEntry } from "../../types";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { ChatList } from "./chat-list";

function folderName(path: string): string {
  return path.split("/").pop() || path;
}

interface ChatSidebarProps {
  workspaces: WorkspaceEntry[];
  activeChatId: string | null;
  onSelectChat: (workspacePath: string, chatId: string) => void;
  onNewChat: (workspacePath: string) => void;
  onAddWorkspace: () => void;
  children: React.ReactNode;
}

export function ChatSidebar({
  workspaces,
  activeChatId,
  onSelectChat,
  onNewChat,
  onAddWorkspace,
  children,
}: ChatSidebarProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const chatQueries = useQueries({
    queries: workspaces.map((ws) => ({
      queryKey: ["chats", ws.folderPath, activeChatId],
      queryFn: () =>
        trpc.claude.listChats
          .query({ workspacePath: ws.folderPath })
          .then((list) => list.map((c) => ({ id: c.id, name: c.name }))),
    })),
  });

  const workspacesWithChats = workspaces.map((ws, i) => ({
    folderPath: ws.folderPath,
    name: folderName(ws.folderPath),
    repoFullName: ws.repo?.fullName ?? null,
    chats: chatQueries[i].data ?? [],
  }));

  const handleDelete = (workspacePath: string, chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trpc.claude.deleteChat.mutate({ chatId }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["chats", workspacePath] });
    });
  };

  return (
    <SidebarProvider>
      <ChatList
        workspaces={workspacesWithChats}
        activeChatId={activeChatId}
        onSelectChat={onSelectChat}
        onDeleteChat={handleDelete}
        onNewChat={onNewChat}
        onAddWorkspace={onAddWorkspace}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
