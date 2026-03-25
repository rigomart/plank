import { useCallback, useEffect, useState } from 'react'
import { trpc } from '../trpc'
import type { RepoInfo, Workspace, WorkspaceEntry } from '../types'
import { ChatPanel } from './ChatPanel'
import { ChatSidebar } from './ChatSidebar'
import { HeaderBar } from './HeaderBar'

export function Workbench(): React.JSX.Element {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([])
  const [chatId, setChatId] = useState<string | null>(null)

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

  const handleNewChat = useCallback(() => {
    if (!workspace) return
    const id = crypto.randomUUID()
    trpc.claude.createChat
      .mutate({ id, workspacePath: workspace.folderPath })
      .then(() => setChatId(id))
      .catch(() => {})
  }, [workspace])

  const handleSelectChat = useCallback((id: string) => {
    setChatId(id)
  }, [])

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
      setChatId(null)
    } catch {}
  }

  const handleSelectWorkspace = async (entry: WorkspaceEntry): Promise<void> => {
    const result = await trpc.workspace.setActive.mutate({ folderPath: entry.folderPath })
    setWorkspace({
      folderPath: result.folderPath,
      repo: result.repo as RepoInfo | null
    })
    setChatId(null)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <HeaderBar
        workspace={workspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onAddWorkspace={handleAddWorkspace}
        onNewChat={handleNewChat}
      />
      {workspace ? (
        <div className="flex min-h-0 flex-1">
          <ChatSidebar
            workspace={workspace}
            activeChatId={chatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
          />
          {chatId ? (
            <ChatPanel key={chatId} workspace={workspace} chatId={chatId} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Select a chat or start a new one
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-muted-foreground">Select a workspace to get started</span>
        </div>
      )}
    </div>
  )
}
