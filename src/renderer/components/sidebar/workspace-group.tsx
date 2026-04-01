import { ChevronRight, Plus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
} from "../ui/sidebar";
import { ChatListItem } from "./chat-list-item";

interface ChatSummary {
  id: string;
  name: string;
}

interface WorkspaceGroupProps {
  name: string;
  repoFullName: string | null;
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
}

export function WorkspaceGroup({
  name,
  repoFullName,
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
}: WorkspaceGroupProps): React.JSX.Element {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup className="p-0 px-2 py-1">
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="text-sm font-semibold text-sidebar-foreground"
        >
          <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
          <span className="truncate">{repoFullName || name}</span>
        </SidebarGroupLabel>
        <SidebarGroupAction onClick={onNewChat} title="New chat">
          <Plus />
        </SidebarGroupAction>
        <CollapsibleContent>
          <SidebarMenu>
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                name={chat.name}
                isActive={chat.id === activeChatId}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={(e) => onDeleteChat(chat.id, e)}
              />
            ))}
          </SidebarMenu>
          {chats.length === 0 && (
            <div className="px-2 py-2 text-xs text-sidebar-foreground/50">
              No chats yet
            </div>
          )}
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
