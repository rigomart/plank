import { useCallback, useEffect, useState } from 'react'
import { trpc } from '../trpc'
import type { RepoInfo, Workspace, WorkspaceEntry } from '../types'
import { ChatPanel } from './ChatPanel'
import { HeaderBar } from './HeaderBar'

export function Workbench(): React.JSX.Element {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([])
  const [chatId, setChatId] = useState(() => crypto.randomUUID())

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
      setChatId(crypto.randomUUID())
    } catch {}
  }

  const handleSelectWorkspace = async (entry: WorkspaceEntry): Promise<void> => {
    const result = await trpc.workspace.setActive.mutate({ folderPath: entry.folderPath })
    setWorkspace({
      folderPath: result.folderPath,
      repo: result.repo as RepoInfo | null
    })
    setChatId(crypto.randomUUID())
  }

  const handleNewChat = useCallback(() => {
    setChatId(crypto.randomUUID())
  }, [])

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
        <ChatPanel key={chatId} workspace={workspace} chatId={chatId} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-muted-foreground">Select a workspace to get started</span>
        </div>
      )}
    </div>
  )
}
