import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Plus, Trash } from "lucide-react";
import { trpc } from "../../trpc";
import type { Workspace, WorkspaceEntry } from "../../types";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../ui/sidebar";

function folderName(path: string): string {
  return path.split("/").pop() || path;
}

export interface Selection {
  workspace: Workspace;
  chatId: string;
}

function WorkspaceChats({
  chats,
  activeChatId,
  onSelect,
  onDelete,
}: {
  chats: { id: string; name: string }[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string, e: React.MouseEvent) => void;
}): React.JSX.Element {
  if (chats.length === 0) {
    return (
      <div className="px-2 py-2 text-xs text-sidebar-foreground/50">No chats yet</div>
    );
  }

  return (
    <SidebarMenuSub>
      {chats.map((chat) => (
        <SidebarMenuSubItem key={chat.id}>
          <SidebarMenuSubButton
            isActive={chat.id === activeChatId}
            size="sm"
            onClick={() => onSelect(chat.id)}
          >
            <span>{chat.name}</span>
          </SidebarMenuSubButton>
          <SidebarMenuAction
            showOnHover
            onClick={(e) => onDelete(chat.id, e)}
            title="Delete chat"
          >
            <Trash className="text-muted-foreground" />
          </SidebarMenuAction>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

interface ChatSidebarProps {
  onSelectionChange: (selection: Selection | null) => void;
  activeChatId: string | null;
}

export function ChatSidebar({
  onSelectionChange,
  activeChatId,
}: ChatSidebarProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const data = await trpc.workspace.list.query();
      const entries = data.workspaces as WorkspaceEntry[];
      if (!activeChatId && data.lastUsedPath) {
        const entry = entries.find((w) => w.folderPath === data.lastUsedPath);
        if (entry) {
          onSelectionChange({
            workspace: { folderPath: entry.folderPath, repo: entry.repo },
            chatId: "",
          });
        }
      }
      return entries;
    },
  });

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

  const findEntry = (path: string) => workspaces.find((w) => w.folderPath === path);

  const handleSelectChat = (workspacePath: string, id: string) => {
    const entry = findEntry(workspacePath);
    if (entry) {
      onSelectionChange({
        workspace: { folderPath: entry.folderPath, repo: entry.repo },
        chatId: id,
      });
    }
  };

  const handleNewChat = (workspacePath: string) => {
    const entry = findEntry(workspacePath);
    if (!entry) return;
    const id = crypto.randomUUID();
    trpc.claude.createChat.mutate({ id, workspacePath }).then(() => {
      onSelectionChange({
        workspace: { folderPath: entry.folderPath, repo: entry.repo },
        chatId: id,
      });
      queryClient.invalidateQueries({ queryKey: ["chats", workspacePath] });
    });
  };

  const handleDeleteChat = (workspacePath: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trpc.claude.deleteChat.mutate({ chatId: id }).then(() => {
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
    onSelectionChange({
      workspace: { folderPath: ws.folderPath, repo: ws.repo },
      chatId: "",
    });
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-sidebar-foreground/70">
            Workspaces
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleAddWorkspace}
            title="Add workspace"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {workspacesWithChats.map((ws) => (
              <Collapsible key={ws.folderPath} defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger render={<SidebarMenuButton />}>
                    <ChevronRight className="transition-transform group-data-panel-open/menu-button:rotate-90" />
                    <span className="truncate">{ws.repoFullName || ws.name}</span>

                    <SidebarMenuAction
                      showOnHover
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNewChat(ws.folderPath);
                      }}
                      title="New chat"
                    >
                      <Plus className="text-muted-foreground" />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <WorkspaceChats
                      chats={ws.chats}
                      activeChatId={activeChatId}
                      onSelect={(chatId) => handleSelectChat(ws.folderPath, chatId)}
                      onDelete={(chatId, e) => handleDeleteChat(ws.folderPath, chatId, e)}
                    />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
