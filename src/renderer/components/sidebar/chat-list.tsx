import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { ChatListItem } from "./chat-list-item";

interface ChatSummary {
  id: string;
  name: string;
}

interface ChatListProps {
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
}

export function ChatList({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
}: ChatListProps): React.JSX.Element {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Chats</span>
        <Button variant="ghost" size="icon-xs" onClick={onNewChat} title="New chat">
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-2">
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
            <div className="px-2.5 py-4 text-center text-xs text-muted-foreground">
              No chats yet
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
