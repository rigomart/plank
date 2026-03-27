import { Plus } from "lucide-react";
import type { Workspace, WorkspaceEntry } from "../../types";
import { Button } from "../ui/button";
import { WorkspaceSelector } from "./workspace-selector";

interface HeaderBarProps {
  workspace: Workspace | null;
  workspaces: WorkspaceEntry[];
  onSelectWorkspace: (entry: WorkspaceEntry) => void;
  onAddWorkspace: () => void;
  onNewChat: () => void;
}

export function HeaderBar({
  workspace,
  workspaces,
  onSelectWorkspace,
  onAddWorkspace,
  onNewChat,
}: HeaderBarProps): React.JSX.Element {
  const noDrag = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-3"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" style={noDrag}>
        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          P
        </div>
        <span className="text-sm font-medium text-card-foreground">Plank</span>
        <span className="text-sm text-muted-foreground">/</span>
        <WorkspaceSelector
          workspace={workspace}
          workspaces={workspaces}
          onSelectWorkspace={onSelectWorkspace}
          onAddWorkspace={onAddWorkspace}
        />
      </div>

      <div className="flex items-center gap-2" style={noDrag}>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onNewChat}>
          <Plus className="size-3.5" />
          New Chat
        </Button>
      </div>
    </header>
  );
}
