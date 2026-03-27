import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
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
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1 px-2 py-1">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-xs" className="shrink-0">
            <ChevronRight
              className={`size-3 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-card-foreground">
          {repoFullName || name}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onNewChat}
          title="New chat"
          className="shrink-0 opacity-0 group-hover/group:opacity-100 hover:opacity-100 focus-visible:opacity-100"
        >
          <Plus className="size-3" />
        </Button>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-0.5 pb-1 pl-3 pr-2">
          {chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              name={chat.name}
              isActive={chat.id === activeChatId}
              onSelect={() => onSelectChat(chat.id)}
              onDelete={(e) => onDeleteChat(chat.id, e)}
            />
          ))}
          {chats.length === 0 && (
            <div className="px-2.5 py-2 text-xs text-muted-foreground">No chats yet</div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
