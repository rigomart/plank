import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "../trpc";
import type { Workspace, WorkspaceEntry } from "../types";
import { ChatPanel } from "./chat";
import { ChatSidebar } from "./sidebar";

export function Workbench(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const data = await trpc.workspace.list.query();
      const entries = data.workspaces as WorkspaceEntry[];
      if (!workspace && data.lastUsedPath) {
        const entry = entries.find((w) => w.folderPath === data.lastUsedPath);
        if (entry) {
          setWorkspace({ folderPath: entry.folderPath, repo: entry.repo });
        }
      }
      return entries;
    },
  });

  const handleSelectChat = (workspacePath: string, id: string) => {
    const entry = workspaces.find((w) => w.folderPath === workspacePath);
    if (entry) {
      setWorkspace({ folderPath: entry.folderPath, repo: entry.repo });
    }
    setChatId(id);
  };

  const handleNewChat = (workspacePath: string) => {
    const entry = workspaces.find((w) => w.folderPath === workspacePath);
    if (entry) {
      setWorkspace({ folderPath: entry.folderPath, repo: entry.repo });
    }
    const id = crypto.randomUUID();
    trpc.claude.createChat.mutate({ id, workspacePath }).then(() => {
      setChatId(id);
      queryClient.invalidateQueries({ queryKey: ["chats", workspacePath] });
    });
  };

  const handleAddWorkspace = async (): Promise<void> => {
    const entry = await trpc.workspace.add.mutate();
    if (!entry) return;
    const ws = entry as WorkspaceEntry;
    queryClient.setQueryData<WorkspaceEntry[]>(["workspaces"], (prev = []) => {
      if (prev.some((w) => w.folderPath === ws.folderPath)) return prev;
      return [...prev, ws];
    });
    setWorkspace({ folderPath: ws.folderPath, repo: ws.repo });
    setChatId(null);
  };

  return (
    <ChatSidebar
      workspaces={workspaces}
      activeChatId={chatId}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
      onAddWorkspace={handleAddWorkspace}
    >
      {workspace && chatId ? (
        <ChatPanel key={chatId} workspace={workspace} chatId={chatId} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-muted-foreground">
            {workspaces.length === 0
              ? "Add a workspace to get started"
              : "Select a chat or start a new one"}
          </span>
        </div>
      )}
    </ChatSidebar>
  );
}
