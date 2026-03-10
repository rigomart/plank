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

export function saveLastWorkspace(folderPath: string): void {
  writeFileSync(WORKSPACE_FILE, JSON.stringify({ lastFolderPath: folderPath }))
}

export function loadLastWorkspace(): string | null {
  if (!existsSync(WORKSPACE_FILE)) return null
  try {
    const data = JSON.parse(readFileSync(WORKSPACE_FILE, 'utf-8'))
    if (data.lastFolderPath && existsSync(data.lastFolderPath)) {
      return data.lastFolderPath
    }
  } catch {
    // ignore corrupt file
  }
  return null
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
