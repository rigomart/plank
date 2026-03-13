import { Check, ChevronDown, FolderOpen, GitFork, Lock, LogOut, Plus, Settings } from 'lucide-react'
import type { Session } from '../App'
import type { Workspace, WorkspaceEntry } from '../types'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'

function folderName(path: string): string {
  return path.split('/').pop() || path
}

interface HeaderBarProps {
  workspace: Workspace | null
  workspaces: WorkspaceEntry[]
  session: Session
  onSelectWorkspace: (entry: WorkspaceEntry) => void
  onAddWorkspace: () => void
  onNewSession: () => void
  onLogout: () => void
}

export function HeaderBar({
  workspace,
  workspaces,
  session,
  onSelectWorkspace,
  onAddWorkspace,
  onNewSession,
  onLogout
}: HeaderBarProps): React.JSX.Element {
  const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" style={noDrag}>
        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          P
        </div>
        <span className="text-sm font-medium text-card-foreground">Planner</span>
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
                  (workspace ? folderName(workspace.folderPath) : 'Select workspace')}
              </span>
              <Lock className="size-3 text-muted-foreground" />
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {workspaces.map((entry) => {
              const isActive = entry.folderPath === workspace?.folderPath
              return (
                <DropdownMenuItem
                  key={entry.folderPath}
                  className="flex items-center gap-2.5"
                  onSelect={() => {
                    if (!isActive) onSelectWorkspace(entry)
                  }}
                >
                  <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {folderName(entry.folderPath)}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {entry.repo?.fullName || 'No remote'}
                    </div>
                  </div>
                  {isActive && <Check className="size-3 shrink-0" />}
                </DropdownMenuItem>
              )
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
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onNewSession}>
          <Plus className="size-3.5" />
          New Session
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar size="sm">
                <AvatarImage src={session.user.avatar_url} alt={session.user.login} />
                <AvatarFallback>{session.user.login[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-muted-foreground">
                {session.user.name || session.user.login}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2.5" onSelect={onLogout}>
              <LogOut className="size-3.5" />
              <span className="text-[13px]">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
