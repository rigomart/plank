import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "../trpc";
import type { RepoInfo, Workspace, WorkspaceEntry } from "../types";
import { ChatPanel } from "./chat";
import { HeaderBar } from "./layout/header-bar";
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

  const handleNewChat = () => {
    if (!workspace) return;
    const id = crypto.randomUUID();
    trpc.claude.createChat
      .mutate({ id, workspacePath: workspace.folderPath })
      .then(() => setChatId(id));
  };

  const handleSelectChat = (id: string) => {
    setChatId(id);
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

  const handleSelectWorkspace = async (entry: WorkspaceEntry): Promise<void> => {
    const result = await trpc.workspace.setActive.mutate({
      folderPath: entry.folderPath,
    });
    setWorkspace({
      folderPath: result.folderPath,
      repo: result.repo as RepoInfo | null,
    });
    setChatId(null);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <HeaderBar
        workspace={workspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onAddWorkspace={handleAddWorkspace}
        onNewChat={handleNewChat}
      />
      {workspace ? (
        <div className="flex min-h-0 flex-1">
          <ChatSidebar
            workspace={workspace}
            activeChatId={chatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
          />
          {chatId ? (
            <ChatPanel key={chatId} workspace={workspace} chatId={chatId} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Select a chat or start a new one
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Select a workspace to get started
          </span>
        </div>
      )}
    </div>
  );
}
