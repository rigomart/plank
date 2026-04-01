import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Sidebar, SidebarContent, SidebarHeader } from "../ui/sidebar";
import { WorkspaceGroup } from "./workspace-group";

interface ChatSummary {
  id: string;
  name: string;
}

interface WorkspaceWithChats {
  folderPath: string;
  name: string;
  repoFullName: string | null;
  chats: ChatSummary[];
}

interface ChatListProps {
  workspaces: WorkspaceWithChats[];
  activeChatId: string | null;
  onSelectChat: (workspacePath: string, chatId: string) => void;
  onDeleteChat: (workspacePath: string, chatId: string, e: React.MouseEvent) => void;
  onNewChat: (workspacePath: string) => void;
  onAddWorkspace: () => void;
}

export function ChatList({
  workspaces,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onAddWorkspace,
}: ChatListProps): React.JSX.Element {
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
            onClick={onAddWorkspace}
            title="Add workspace"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {workspaces.map((ws) => (
          <WorkspaceGroup
            key={ws.folderPath}
            name={ws.name}
            repoFullName={ws.repoFullName}
            chats={ws.chats}
            activeChatId={activeChatId}
            onSelectChat={(chatId) => onSelectChat(ws.folderPath, chatId)}
            onDeleteChat={(chatId, e) => onDeleteChat(ws.folderPath, chatId, e)}
            onNewChat={() => onNewChat(ws.folderPath)}
          />
        ))}
        {workspaces.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-sidebar-foreground/50">
            No workspaces yet
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
