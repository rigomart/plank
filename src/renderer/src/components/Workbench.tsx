import { useCallback, useState } from 'react'
import type { Session } from '../App'
import { Terminal } from './Terminal'

interface Issue {
  id: string
  number: number
  title: string
  description: string
  labels: string[]
}

const issues: Issue[] = [
  {
    id: '1',
    number: 12,
    title: 'Add authentication flow with OAuth',
    description:
      'Implement OAuth 2.0 authentication flow using GitHub as the provider. Should support login, logout, and token refresh. Store tokens securely in the system keychain.',
    labels: ['feature', 'auth']
  },
  {
    id: '2',
    number: 15,
    title: 'Fix memory leak in WebSocket handler',
    description:
      'The WebSocket connection handler is not properly cleaning up event listeners on disconnect, causing a memory leak under sustained load. Reproduce by connecting/disconnecting 1000 times.',
    labels: ['bug', 'critical']
  },
  {
    id: '3',
    number: 18,
    title: 'Migrate database schema to use UUIDs',
    description:
      'Replace auto-incrementing integer IDs with UUIDs across all tables. Write a migration that preserves existing foreign key relationships. Update all queries and models accordingly.',
    labels: ['refactor', 'database']
  },
  {
    id: '4',
    number: 21,
    title: 'Add rate limiting to API endpoints',
    description:
      'Implement sliding window rate limiting on all public API endpoints. Default to 100 requests per minute per IP. Add configurable limits per route. Return proper 429 responses with Retry-After header.',
    labels: ['feature', 'security']
  },
  {
    id: '5',
    number: 24,
    title: 'Write E2E tests for checkout flow',
    description:
      'Add Playwright E2E tests covering the full checkout flow: add to cart, enter shipping info, select payment method, confirm order, and verify confirmation page. Cover error states.',
    labels: ['testing']
  }
]

const labelColors: Record<string, string> = {
  feature: '#1f6feb',
  bug: '#d73a49',
  critical: '#b60205',
  refactor: '#a371f7',
  database: '#0e8a16',
  auth: '#1f6feb',
  security: '#e3b341',
  testing: '#0e8a16'
}

function buildPrompt(issue: Issue): string {
  return `Issue #${issue.number}: ${issue.title}\n\n${issue.description}\n\nLabels: ${issue.labels.join(', ')}`
}

interface WorkbenchProps {
  session: Session
  onLogout: () => void
}

export function Workbench({ session, onLogout }: WorkbenchProps): React.JSX.Element {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exited, setExited] = useState(false)

  const handleLaunch = (issue: Issue): void => {
    setActiveIssue(issue)
    setSelectedId(issue.id)
    setExited(false)
  }

  const handleExit = useCallback(() => {
    setExited(true)
  }, [])

  const handleClose = (): void => {
    setActiveIssue(null)
    setSelectedId(null)
    setExited(false)
  }

  return (
    <div className="workbench">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">Issues</span>
          <span className="sidebar-count">{issues.length}</span>
        </div>
        <div className="issue-list">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`issue-card${selectedId === issue.id ? ' issue-card--active' : ''}`}
            >
              <div className="issue-top">
                <span className="issue-number">#{issue.number}</span>
                <div className="issue-labels">
                  {issue.labels.map((label) => (
                    <span
                      key={label}
                      className="issue-label"
                      style={{ background: labelColors[label] || '#555' }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="issue-title">{issue.title}</div>
              <div className="issue-desc">{issue.description}</div>
              <button
                type="button"
                className="issue-launch"
                onClick={() => handleLaunch(issue)}
                disabled={selectedId === issue.id && !exited}
              >
                {selectedId === issue.id && !exited ? 'Running' : 'Start'}
              </button>
            </div>
          ))}
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
              initialInput={buildPrompt(activeIssue)}
              onExit={handleExit}
            />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">&#9654;</div>
            <div className="empty-text">Select an issue and click Start</div>
          </div>
        )}
      </main>
    </div>
  )
}
