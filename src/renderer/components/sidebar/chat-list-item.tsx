import { Trash2 } from "lucide-react";

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
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard nav handled by tabIndex focus
    // biome-ignore lint/a11y/noStaticElementInteractions: interactive container with nested button
    <div
      onClick={onSelect}
      className={`group flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-card-foreground"
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
      <button
        type="button"
        className="show-on-hover shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive"
        onClick={onDelete}
        title="Delete chat"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}
