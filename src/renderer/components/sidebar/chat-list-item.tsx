import { MessageSquare, Trash2 } from "lucide-react";

interface ChatListItemProps {
  name: string;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function ChatListItem({
  name,
  isActive,
  onSelect,
  onDelete,
}: ChatListItemProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-card-foreground"
      }`}
    >
      <MessageSquare className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-xs">{name}</span>
      <button
        type="button"
        className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
        onClick={onDelete}
        title="Delete chat"
      >
        <Trash2 className="size-3" />
      </button>
    </button>
  );
}
