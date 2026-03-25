export interface RepoInfo {
  owner: string
  repo: string
  fullName: string
}

export interface WorkspaceEntry {
  folderPath: string
  repo: RepoInfo | null
  addedAt: string
}

export interface Workspace {
  folderPath: string
  repo: RepoInfo | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sessionId?: string
  usage?: { inputTokens: number; outputTokens: number }
  costUsd?: number
}
