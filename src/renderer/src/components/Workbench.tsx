import { useCallback, useEffect, useState } from 'react'
import type { Session } from '../App'
import { trpc } from '../trpc'
import type { GitHubIssue, RepoInfo, Workspace, WorkspaceEntry } from '../types'
import { HeaderBar } from './HeaderBar'
import { IssueSidebar } from './IssueSidebar'
import { MainPanel } from './MainPanel'

export function buildPrompt(issue: GitHubIssue): string {
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

  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([])

  useEffect(() => {
    trpc.workspace.list
      .query()
      .then((data) => {
        setWorkspaces(data.workspaces as WorkspaceEntry[])
        if (data.lastUsedPath) {
          const entry = (data.workspaces as WorkspaceEntry[]).find(
            (w) => w.folderPath === data.lastUsedPath
          )
          if (entry) {
            setWorkspace({ folderPath: entry.folderPath, repo: entry.repo })
          }
        }
      })
      .catch(() => {})
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

  const handleAddWorkspace = async (): Promise<void> => {
    try {
      const entry = await trpc.workspace.add.mutate()
      if (!entry) return
      const ws = entry as WorkspaceEntry
      setWorkspaces((prev) => {
        if (prev.some((w) => w.folderPath === ws.folderPath)) return prev
        return [...prev, ws]
      })
      setWorkspace({ folderPath: ws.folderPath, repo: ws.repo })
      resetTerminalState()
    } catch {}
  }

  const handleSelectWorkspace = async (entry: WorkspaceEntry): Promise<void> => {
    const result = await trpc.workspace.setActive.mutate({ folderPath: entry.folderPath })
    setWorkspace({
      folderPath: result.folderPath,
      repo: result.repo as RepoInfo | null
    })
    resetTerminalState()
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

  const prompt = activeIssue ? buildPrompt(activeIssue) : null

  return (
    <div className="flex h-full w-full flex-col">
      <HeaderBar
        workspace={workspace}
        workspaces={workspaces}
        session={session}
        onSelectWorkspace={handleSelectWorkspace}
        onAddWorkspace={handleAddWorkspace}
        onNewSession={resetTerminalState}
        onLogout={onLogout}
      />
      <div className="flex min-h-0 flex-1">
        <IssueSidebar
          issues={issues}
          issuesLoading={issuesLoading}
          hasRepo={!!workspace?.repo}
          selectedId={selectedId}
          onSelectIssue={handleLaunch}
        />
        <MainPanel
          workspace={workspace}
          activeIssue={activeIssue}
          prompt={prompt}
          exited={exited}
          onExit={handleExit}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
