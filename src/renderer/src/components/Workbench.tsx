import { useCallback, useEffect, useState } from 'react'
import type { Session } from '../App'
import { trpc } from '../trpc'
import { Terminal } from './Terminal'

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

  // Fetch repos on mount for the picker
  useEffect(() => {
    trpc.github.repos
      .query()
      .then((r) => setRepos(r as GitHubRepo[]))
      .catch(() => {})
      .finally(() => setReposLoading(false))
  }, [])

  // Check for last-used workspace on mount
  useEffect(() => {
    trpc.workspace.lastUsed.query().then((result) => {
      if (result) {
        setWorkspace({ folderPath: result.path, repo: result.repo })
      }
    })
  }, [])

  // Fetch issues when workspace changes
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
    // Use the explicitly selected repo, not the auto-detected one
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
      <div className="workbench">
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">Repositories</span>
            {!reposLoading && <span className="sidebar-count">{repos.length}</span>}
          </div>
          <div className="repo-search">
            <input
              className="repo-filter"
              placeholder="Search repositories..."
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
            />
          </div>
          <div className="repo-list">
            {reposLoading ? (
              <div className="list-loading">Loading repositories...</div>
            ) : filteredRepos.length === 0 ? (
              <div className="list-empty">No repositories found</div>
            ) : (
              filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  type="button"
                  className="repo-card"
                  onClick={() => handleSelectRepo(repo)}
                >
                  <div className="repo-name">
                    {repo.full_name}
                    {repo.private && <span className="repo-badge">private</span>}
                  </div>
                  {repo.description && <div className="repo-desc">{repo.description}</div>}
                  {repo.open_issues_count > 0 && (
                    <div className="repo-meta">
                      {repo.open_issues_count} open issue{repo.open_issues_count !== 1 && 's'}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="sidebar-footer">
            <img className="avatar" src={session.user.avatar_url} alt={session.user.login} />
            <span className="avatar-name">{session.user.name || session.user.login}</span>
            <button type="button" className="logout-button" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="main-panel">
          <div className="workspace-picker">
            <div className="workspace-picker-icon">&#128193;</div>
            <div className="workspace-picker-title">Open a workspace</div>
            <div className="workspace-picker-subtitle">
              Select a local folder to start working. GitHub issues will be loaded automatically
              from the detected remote.
            </div>
            <button type="button" className="workspace-picker-button" onClick={handleOpenFolder}>
              Open Folder
            </button>
            <div className="workspace-picker-hint">or select a repository from the sidebar</div>
          </div>
        </main>
      </div>
    )
  }

  // Mode B: Workspace selected — show issues
  return (
    <div className="workbench">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-info">
            <span className="sidebar-repo">{workspace.repo?.fullName || folderName}</span>
            <span className="sidebar-path" title={workspace.folderPath}>
              {workspace.folderPath}
            </span>
          </div>
          <button type="button" className="sidebar-change" onClick={handleChangeWorkspace}>
            Change
          </button>
        </div>
        {workspace.repo ? (
          <>
            <div className="issues-subheader">
              <span className="sidebar-title">Issues</span>
              <span className="sidebar-count">{issues.length}</span>
            </div>
            <div className="issue-list">
              {issuesLoading ? (
                <div className="list-loading">Loading issues...</div>
              ) : issues.length === 0 ? (
                <div className="list-empty">No open issues</div>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`issue-card${selectedId === issue.id ? ' issue-card--active' : ''}`}
                  >
                    <div className="issue-top">
                      <span className="issue-number">#{issue.number}</span>
                      <div className="issue-labels">
                        {issue.labels.map((label) => (
                          <span
                            key={label.name}
                            className="issue-label"
                            style={{ background: `#${label.color}` }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="issue-title">{issue.title}</div>
                    {issue.body && <div className="issue-desc">{issue.body}</div>}
                    <button
                      type="button"
                      className="issue-launch"
                      onClick={() => handleLaunch(issue)}
                      disabled={selectedId === issue.id && !exited}
                    >
                      {selectedId === issue.id && !exited ? 'Running' : 'Start'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="no-repo-info">
            <div className="no-repo-info-title">No GitHub remote detected</div>
            <div className="no-repo-info-subtitle">
              Issues are not available for this folder.
              <br />
              You can still use the terminal below.
            </div>
          </div>
        )}
        <div className="sidebar-footer">
          <img className="avatar" src={session.user.avatar_url} alt={session.user.login} />
          <span className="avatar-name">{session.user.name || session.user.login}</span>
          <button type="button" className="logout-button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-panel">
        {activeIssue ? (
          <div className="terminal-panel">
            {exited && (
              <div className="exit-banner">
                <span>Process exited</span>
                <button type="button" onClick={handleClose}>
                  Close
                </button>
              </div>
            )}
            <Terminal
              key={activeIssue.id}
              command="claude"
              args={[]}
              cwd={workspace.folderPath}
              initialInput={buildPrompt(activeIssue)}
              onExit={handleExit}
            />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">&#9654;</div>
            <div className="empty-text">
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
