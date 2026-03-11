import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { Session } from '../App'
import { trpc } from '../trpc'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Skeleton } from './ui/skeleton'

const Terminal = lazy(() => import('./Terminal').then((m) => ({ default: m.Terminal })))

interface RepoInfo {
  owner: string
  repo: string
  fullName: string
}

interface Workspace {
  folderPath: string
  repo: RepoInfo | null
}

interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  labels: Array<{ name: string; color: string }>
}

interface GitHubRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string }
  description: string | null
  private: boolean
  open_issues_count: number
}

function buildPrompt(issue: GitHubIssue): string {
  const labels = issue.labels.map((l) => l.name).join(', ')
  let prompt = `Issue #${issue.number}: ${issue.title}`
  if (issue.body) prompt += `\n\n${issue.body}`
  if (labels) prompt += `\n\nLabels: ${labels}`
  return prompt
}

interface WorkbenchProps {
  session: Session
  onLogout: () => void
}

export function Workbench({ session, onLogout }: WorkbenchProps): React.JSX.Element {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [activeIssue, setActiveIssue] = useState<GitHubIssue | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [exited, setExited] = useState(false)

  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(true)
  const [repoFilter, setRepoFilter] = useState('')

  useEffect(() => {
    trpc.github.repos
      .query()
      .then((r) => setRepos(r as GitHubRepo[]))
      .catch(() => {})
      .finally(() => setReposLoading(false))
  }, [])

  useEffect(() => {
    trpc.workspace.lastUsed.query().then((result) => {
      if (result) {
        setWorkspace({ folderPath: result.path, repo: result.repo })
      }
    })
  }, [])

  const currentRepo = workspace?.repo ?? null
  useEffect(() => {
    if (!currentRepo) {
      setIssues([])
      return
    }
    setIssuesLoading(true)
    trpc.github.issues
      .query({ owner: currentRepo.owner, repo: currentRepo.repo })
      .then((i) => setIssues(i as GitHubIssue[]))
      .catch(() => setIssues([]))
      .finally(() => setIssuesLoading(false))
  }, [currentRepo])

  const openFolderDialog = async (): Promise<Workspace | null> => {
    const result = await trpc.workspace.selectFolder.mutate()
    if (!result) return null
    return { folderPath: result.path, repo: result.repo }
  }

  const handleOpenFolder = async (): Promise<void> => {
    const ws = await openFolderDialog()
    if (ws) {
      setWorkspace(ws)
      resetTerminalState()
    }
  }

  const handleSelectRepo = async (repo: GitHubRepo): Promise<void> => {
    const ws = await openFolderDialog()
    if (!ws) return
    setWorkspace({
      folderPath: ws.folderPath,
      repo: { owner: repo.owner.login, repo: repo.name, fullName: repo.full_name }
    })
    resetTerminalState()
  }

  const handleChangeWorkspace = (): void => {
    setWorkspace(null)
    resetTerminalState()
    setIssues([])
  }

  const resetTerminalState = (): void => {
    setActiveIssue(null)
    setSelectedId(null)
    setExited(false)
  }

  const handleLaunch = (issue: GitHubIssue): void => {
    setActiveIssue(issue)
    setSelectedId(issue.id)
    setExited(false)
  }

  const handleExit = useCallback(() => setExited(true), [])

  const handleClose = (): void => resetTerminalState()

  const folderName = workspace?.folderPath.split('/').pop() || ''

  // Mode A: No workspace — show repo picker
  if (!workspace) {
    const filteredRepos = repos.filter((r) =>
      r.full_name.toLowerCase().includes(repoFilter.toLowerCase())
    )

    return (
      <div className="flex h-full w-full">
        <aside className="flex h-full w-80 min-w-80 flex-col overflow-hidden border-r border-border bg-card">
          <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Repositories
            </span>
            {!reposLoading && (
              <Badge variant="secondary" className="text-[11px]">
                {repos.length}
              </Badge>
            )}
          </div>
          <div className="border-b border-border px-2.5 pb-2">
            <Input
              placeholder="Search repositories..."
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5">
              {reposLoading ? (
                <div className="space-y-2 p-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No repositories found
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    className="mb-0.5 w-full cursor-pointer rounded-md border-none bg-transparent p-2.5 text-left text-inherit transition-colors hover:bg-sidebar-accent"
                    onClick={() => handleSelectRepo(repo)}
                  >
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-card-foreground">
                      {repo.full_name}
                      {repo.private && (
                        <Badge variant="secondary" className="text-[10px]">
                          private
                        </Badge>
                      )}
                    </div>
                    {repo.description && (
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {repo.description}
                      </div>
                    )}
                    {repo.open_issues_count > 0 && (
                      <div className="mt-1 text-[11px] text-muted-foreground/60">
                        {repo.open_issues_count} open issue{repo.open_issues_count !== 1 && 's'}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
          <Separator />
          <div className="flex items-center gap-2 px-3.5 py-2.5">
            <Avatar size="sm">
              <AvatarImage src={session.user.avatar_url} alt={session.user.login} />
              <AvatarFallback>{session.user.login[0]}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {session.user.name || session.user.login}
            </span>
            <Button variant="ghost" size="xs" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
            <div className="text-4xl opacity-30">&#128193;</div>
            <div className="text-lg font-semibold text-card-foreground">Open a workspace</div>
            <div className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
              Select a local folder to start working. GitHub issues will be loaded automatically
              from the detected remote.
            </div>
            <Button className="mt-1" onClick={handleOpenFolder}>
              Open Folder
            </Button>
            <div className="text-xs text-muted-foreground/60">
              or select a repository from the sidebar
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Mode B: Workspace selected — show issues
  return (
    <div className="flex h-full w-full">
      <aside className="flex h-full w-80 min-w-80 flex-col overflow-hidden border-r border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 pb-2.5 pt-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold text-card-foreground">
              {workspace.repo?.fullName || folderName}
            </span>
            <span
              className="truncate text-[11px] text-muted-foreground/60"
              title={workspace.folderPath}
            >
              {workspace.folderPath}
            </span>
          </div>
          <Button variant="ghost" size="xs" className="shrink-0" onClick={handleChangeWorkspace}>
            Change
          </Button>
        </div>
        {workspace.repo ? (
          <>
            <div className="flex items-center justify-between px-4 pb-1.5 pt-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Issues
              </span>
              <Badge variant="secondary" className="text-[11px]">
                {issues.length}
              </Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5">
                {issuesLoading ? (
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : issues.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No open issues
                  </div>
                ) : (
                  issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`mb-0.5 rounded-md p-2.5 transition-colors ${
                        selectedId === issue.id
                          ? 'border border-border bg-accent'
                          : 'hover:bg-sidebar-accent'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                          #{issue.number}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {issue.labels.map((label) => (
                            <span
                              key={label.name}
                              className="rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 text-white opacity-85"
                              style={{ background: `#${label.color}` }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mb-1 text-[13px] font-medium leading-snug text-card-foreground">
                        {issue.title}
                      </div>
                      {issue.body && (
                        <div className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {issue.body}
                        </div>
                      )}
                      <Button
                        variant={selectedId === issue.id && !exited ? 'default' : 'secondary'}
                        size="xs"
                        onClick={() => handleLaunch(issue)}
                        disabled={selectedId === issue.id && !exited}
                      >
                        {selectedId === issue.id && !exited ? 'Running' : 'Start'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center">
            <div className="text-[13px] font-medium text-muted-foreground">
              No GitHub remote detected
            </div>
            <div className="text-xs leading-relaxed text-muted-foreground/60">
              Issues are not available for this folder.
              <br />
              You can still use the terminal below.
            </div>
          </div>
        )}
        <Separator />
        <div className="flex items-center gap-2 px-3.5 py-2.5">
          <Avatar size="sm">
            <AvatarImage src={session.user.avatar_url} alt={session.user.login} />
            <AvatarFallback>{session.user.login[0]}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {session.user.name || session.user.login}
          </span>
          <Button variant="ghost" size="xs" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        {activeIssue ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {exited && (
              <div className="flex items-center justify-between border-b border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <span>Process exited</span>
                <Button variant="ghost" size="xs" onClick={handleClose}>
                  Close
                </Button>
              </div>
            )}
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                  Loading terminal...
                </div>
              }
            >
              <Terminal
                key={activeIssue.id}
                command="claude"
                args={[]}
                cwd={workspace.folderPath}
                initialInput={buildPrompt(activeIssue)}
                onExit={handleExit}
              />
            </Suspense>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground/40">
            <div className="text-3xl">&#9654;</div>
            <div className="text-sm">
              {workspace.repo
                ? 'Select an issue and click Start'
                : 'No issues available — use the terminal directly'}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
