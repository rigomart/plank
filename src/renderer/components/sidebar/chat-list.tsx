import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
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
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">Workspaces</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onAddWorkspace}
          title="Add workspace"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 min-w-0 flex-1">
        <div className="flex flex-col gap-1 pb-2">
          {workspaces.map((ws) => (
            <div key={ws.folderPath} className="group/group">
              <WorkspaceGroup
                name={ws.name}
                repoFullName={ws.repoFullName}
                chats={ws.chats}
                activeChatId={activeChatId}
                onSelectChat={(chatId) => onSelectChat(ws.folderPath, chatId)}
                onDeleteChat={(chatId, e) => onDeleteChat(ws.folderPath, chatId, e)}
                onNewChat={() => onNewChat(ws.folderPath)}
              />
            </div>
          ))}
          {workspaces.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No workspaces yet
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
