import { Loader2, SendHorizontal, X } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type { GitHubIssue, Workspace } from '../types'
import { Button } from './ui/button'

const Terminal = lazy(() => import('./Terminal').then((m) => ({ default: m.Terminal })))

interface MainPanelProps {
  workspace: Workspace | null
  activeIssue: GitHubIssue | null
  prompt: string | null
  exited: boolean
  onExit: () => void
  onClose: () => void
}

export function MainPanel({
  workspace,
  activeIssue,
  prompt,
  exited,
  onExit,
  onClose
}: MainPanelProps): React.JSX.Element {
  const isRunning = !!activeIssue && !exited
  const statusText = isRunning ? 'Running' : 'Idle'

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Session header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">claude</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="font-medium text-card-foreground">
              {activeIssue ? `Issue #${activeIssue.number}` : 'New Planning Session'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{statusText}</span>
          {exited && (
            <Button variant="ghost" size="icon-xs" onClick={onClose} title="Close">
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="relative min-h-0 flex-1">
        {activeIssue && workspace ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading terminal...
              </div>
            }
          >
            <Terminal
              key={activeIssue.id}
              command="claude"
              args={[]}
              cwd={workspace.folderPath}
              initialInput={prompt ?? undefined}
              onExit={onExit}
            />
          </Suspense>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <span className="text-sm font-medium text-card-foreground/60">
              Ready to start planning
            </span>
            <span className="text-xs text-muted-foreground">Type a message to begin</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex shrink-0 items-center gap-3 border-t border-border bg-card px-4 py-3">
        <span className="font-mono text-sm text-muted-foreground">&gt;</span>
        <input
          className="flex-1 border-none bg-transparent text-sm text-card-foreground outline-none placeholder:text-muted-foreground/50"
          placeholder="Describe what you want to plan..."
          disabled={isRunning}
        />
        <Button variant="ghost" size="icon-xs" disabled={isRunning}>
          <SendHorizontal className="size-3.5" />
        </Button>
      </div>
    </main>
  )
}
