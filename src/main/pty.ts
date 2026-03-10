import { execSync } from 'node:child_process'
import { type IPty, spawn } from 'node-pty'

const sessions = new Map<string, IPty>()
let nextId = 0

function getLoginEnv(): Record<string, string> {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) }

  try {
    const shell = env.SHELL || '/bin/zsh'
    const loginPath = execSync(`${shell} -ilc 'echo $PATH'`, {
      encoding: 'utf-8',
      timeout: 3000
    }).trim()
    if (loginPath) env.PATH = loginPath
  } catch {
    // keep existing PATH
  }

  return env
}

const loginEnv = getLoginEnv()

export function spawnTerminal(
  command: string,
  args: string[],
  cwd: string,
  onData: (data: string) => void,
  onExit: (exitCode: number, signal?: number) => void
): string {
  const id = String(++nextId)

  const pty = spawn(command, args, {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env: loginEnv
  })

  pty.onData(onData)
  pty.onExit(({ exitCode, signal }) => {
    sessions.delete(id)
    onExit(exitCode, signal)
  })

  sessions.set(id, pty)
  return id
}

export function writeToTerminal(id: string, data: string): void {
  sessions.get(id)?.write(data)
}

export function resizeTerminal(id: string, cols: number, rows: number): void {
  sessions.get(id)?.resize(cols, rows)
}

export function killTerminal(id: string): void {
  const pty = sessions.get(id)
  if (pty) {
    pty.kill()
    sessions.delete(id)
  }
}

export function killAllTerminals(): void {
  for (const pty of sessions.values()) {
    pty.kill()
  }
  sessions.clear()
}
