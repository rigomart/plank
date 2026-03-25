import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '../trpc'
import type { Workspace } from '../types'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'

interface ChatSummary {
  id: string
  name: string
  updatedAt: string
}

interface ChatSidebarProps {
  workspace: Workspace
  activeChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

function fetchChats(workspacePath: string): Promise<ChatSummary[]> {
  return trpc.claude.listChats
    .query({ workspacePath })
    .then((list) =>
      list.map((c) => ({
        id: c.id,
        name: c.name,
        updatedAt: c.updatedAt
      }))
    )
    .catch(() => [])
}

export function ChatSidebar({
  workspace,
  activeChatId,
  onSelectChat,
  onNewChat
}: ChatSidebarProps): React.JSX.Element {
  const [chats, setChats] = useState<ChatSummary[]>([])

  // biome-ignore lint/correctness/useExhaustiveDependencies: activeChatId triggers refresh after chat name updates
  useEffect(() => {
    fetchChats(workspace.folderPath).then(setChats)
  }, [workspace.folderPath, activeChatId])

  const handleDelete = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    trpc.claude.deleteChat.mutate({ chatId }).then(() => {
      fetchChats(workspace.folderPath).then(setChats)
      if (chatId === activeChatId) {
        onNewChat()
      }
    })
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Chats</span>
        <Button variant="ghost" size="icon-xs" onClick={onNewChat} title="New chat">
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => onSelectChat(chat.id)}
              className={`group flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
                chat.id === activeChatId
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-card-foreground'
              }`}
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-xs">{chat.name}</span>
              <button
                type="button"
                className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
                onClick={(e) => handleDelete(chat.id, e)}
                title="Delete chat"
              >
                <Trash2 className="size-3" />
              </button>
            </button>
          ))}
          {chats.length === 0 && (
            <div className="px-2.5 py-4 text-center text-xs text-muted-foreground">
              No chats yet
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
