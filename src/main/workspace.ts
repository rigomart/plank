import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

const WORKSPACE_FILE = join(app.getPath('userData'), 'workspace.json')

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

interface WorkspaceData {
  workspaces: WorkspaceEntry[]
  lastUsedPath: string | null
}

export function detectGitRepo(folderPath: string): RepoInfo | null {
  if (!existsSync(join(folderPath, '.git'))) return null

  try {
    const remoteUrl = execSync('git remote get-url origin', {
      cwd: folderPath,
      encoding: 'utf-8',
      timeout: 3000
    }).trim()

    return parseGitHubUrl(remoteUrl)
  } catch {
    return null
  }
}

function parseGitHubUrl(url: string): RepoInfo | null {
  const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/)
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2],
    fullName: `${match[1]}/${match[2]}`
  }
}

export function loadWorkspaceData(): WorkspaceData {
  const defaultData: WorkspaceData = { workspaces: [], lastUsedPath: null }
  if (!existsSync(WORKSPACE_FILE)) return defaultData

  try {
    const raw = JSON.parse(readFileSync(WORKSPACE_FILE, 'utf-8'))

    // Migrate old format: { lastFolderPath: string }
    if (raw.lastFolderPath && !raw.workspaces) {
      const folderPath = raw.lastFolderPath as string
      if (existsSync(folderPath)) {
        const repo = detectGitRepo(folderPath)
        const migrated: WorkspaceData = {
          workspaces: [{ folderPath, repo, addedAt: new Date().toISOString() }],
          lastUsedPath: folderPath
        }
        saveWorkspaceData(migrated)
        return migrated
      }
      return defaultData
    }

    return {
      workspaces: raw.workspaces ?? [],
      lastUsedPath: raw.lastUsedPath ?? null
    }
  } catch {
    return defaultData
  }
}

export function saveWorkspaceData(data: WorkspaceData): void {
  writeFileSync(WORKSPACE_FILE, JSON.stringify(data, null, 2))
}

export function addWorkspace(folderPath: string, repo: RepoInfo | null): WorkspaceEntry {
  const data = loadWorkspaceData()
  const existing = data.workspaces.find((w) => w.folderPath === folderPath)
  if (existing) {
    data.lastUsedPath = folderPath
    saveWorkspaceData(data)
    return existing
  }

  const entry: WorkspaceEntry = { folderPath, repo, addedAt: new Date().toISOString() }
  data.workspaces.push(entry)
  data.lastUsedPath = folderPath
  saveWorkspaceData(data)
  return entry
}

export function removeWorkspace(folderPath: string): void {
  const data = loadWorkspaceData()
  data.workspaces = data.workspaces.filter((w) => w.folderPath !== folderPath)
  if (data.lastUsedPath === folderPath) {
    data.lastUsedPath = null
  }
  saveWorkspaceData(data)
}

export function setLastUsed(folderPath: string): void {
  const data = loadWorkspaceData()
  data.lastUsedPath = folderPath
  saveWorkspaceData(data)
}
