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

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  labels: Array<{ name: string; color: string }>
}
