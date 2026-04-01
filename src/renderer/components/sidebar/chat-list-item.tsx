import { Trash2 } from "lucide-react";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

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
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} size="sm" onClick={onSelect}>
        <span>{name}</span>
      </SidebarMenuButton>
      <SidebarMenuAction showOnHover onClick={onDelete} title="Delete chat">
        <Trash2 />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}
