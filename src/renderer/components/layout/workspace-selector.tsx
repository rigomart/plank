import { Check, ChevronDown, FolderOpen, GitFork, Lock, Plus } from "lucide-react";
import type { Workspace, WorkspaceEntry } from "../../types";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

function folderName(path: string): string {
  return path.split("/").pop() || path;
}

interface WorkspaceSelectorProps {
  workspace: Workspace | null;
  workspaces: WorkspaceEntry[];
  onSelectWorkspace: (entry: WorkspaceEntry) => void;
  onAddWorkspace: () => void;
}

export function WorkspaceSelector({
  workspace,
  workspaces,
  onSelectWorkspace,
  onAddWorkspace,
}: WorkspaceSelectorProps): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-card-foreground">
          <GitFork className="size-3.5 text-muted-foreground" />
          <span className="text-sm">
            {workspace?.repo?.fullName ||
              (workspace ? folderName(workspace.folderPath) : "Select workspace")}
          </span>
          <Lock className="size-3 text-muted-foreground" />
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
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
                <div className="truncate text-sm font-medium">
                  {folderName(entry.folderPath)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
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
          <span className="text-sm">Add workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
