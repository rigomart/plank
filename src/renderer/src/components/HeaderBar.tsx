import { Check, ChevronDown, FolderOpen, GitFork, Lock, Plus } from "lucide-react";
import type { Workspace, WorkspaceEntry } from "../types";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function folderName(path: string): string {
  return path.split("/").pop() || path;
}

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-inherit transition-colors hover:text-card-foreground"
            >
              <GitFork className="size-3.5 text-muted-foreground" />
              <span className="text-sm text-card-foreground">
                {workspace?.repo?.fullName ||
                  (workspace ? folderName(workspace.folderPath) : "Select workspace")}
              </span>
              <Lock className="size-3 text-muted-foreground" />
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {workspaces.map((entry) => {
              const isActive = entry.folderPath === workspace?.folderPath;
              return (
                <DropdownMenuItem
                  key={entry.folderPath}
                  className="flex items-center gap-2.5"
                  onSelect={() => {
                    if (!isActive) onSelectWorkspace(entry);
                  }}
                >
                  <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {folderName(entry.folderPath)}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {entry.repo?.fullName || "No remote"}
                    </div>
                  </div>
                  {isActive && <Check className="size-3 shrink-0" />}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2.5" onSelect={onAddWorkspace}>
              <Plus className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-[13px]">Add workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
