import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, safeStorage } from 'electron'

const GITHUB_CLIENT_ID: string = import.meta.env.GITHUB_CLIENT_ID || ''
const DEVICE_CODE_URL = 'https://github.com/login/device/code'
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const SCOPES = 'repo read:user'

const TOKEN_FILE = join(app.getPath('userData'), 'auth.enc')

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface GitHubUser {
  login: string
  avatar_url: string
  name: string | null
}

export interface Session {
  token: string
  user: GitHubUser
}

function saveToken(token: string): void {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const encrypted = safeStorage.encryptString(token)
  writeFileSync(TOKEN_FILE, encrypted)
}

function loadToken(): string | null {
  if (!existsSync(TOKEN_FILE)) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    const encrypted = readFileSync(TOKEN_FILE)
    return safeStorage.decryptString(encrypted)
  } catch {
    return null
  }
}

export function clearToken(): void {
  if (existsSync(TOKEN_FILE)) {
    const { unlinkSync } = require('node:fs') as typeof import('node:fs')
    unlinkSync(TOKEN_FILE)
  }
}

async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  })
  if (!res.ok) throw new Error('Invalid token')
  return res.json() as Promise<GitHubUser>
}

export async function getSession(): Promise<Session | null> {
  const token = loadToken()
  if (!token) return null
  try {
    const user = await fetchGitHubUser(token)
    return { token, user }
  } catch {
    clearToken()
    return null
  }
}

export async function startDeviceFlow(): Promise<DeviceCodeResponse> {
  const res = await fetch(DEVICE_CODE_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: SCOPES
    })
  })
  if (!res.ok) throw new Error(`Device code request failed: ${res.status}`)
  return res.json() as Promise<DeviceCodeResponse>
}

export async function pollForToken(
  deviceCode: string,
  interval: number,
  signal?: AbortSignal
): Promise<Session> {
  const wait = (ms: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new Error('Cancelled'))
      })
    })

  while (!signal?.aborted) {
    await wait(interval * 1000)

    const res = await fetch(ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })

    const data = (await res.json()) as {
      access_token?: string
      error?: string
    }

    if (data.access_token) {
      saveToken(data.access_token)
      const user = await fetchGitHubUser(data.access_token)
      return { token: data.access_token, user }
    }

    if (data.error === 'authorization_pending') continue
    if (data.error === 'slow_down') {
      interval += 5
      continue
    }
    throw new Error(data.error || 'Unknown error')
  }

  throw new Error('Cancelled')
}
