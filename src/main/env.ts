import { execSync } from 'node:child_process'

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

const cachedEnv = getLoginEnv()

export function buildClaudeEnv(): Record<string, string> {
  return {
    ...cachedEnv,
    CLAUDE_CODE_ENTRYPOINT: 'sdk-ts'
  }
}
