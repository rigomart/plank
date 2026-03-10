import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

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

function parseGitHubUrl(url: string): RepoInfo | null {
  const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/)
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2],
    fullName: `${match[1]}/${match[2]}`
  }
}
