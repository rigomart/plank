import { execSync } from 'node:child_process'
import { query } from '@anthropic-ai/claude-agent-sdk'

function buildEnv(): Record<string, string | undefined> {
  const env = { ...process.env }
  delete env.CLAUDECODE

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

const env = buildEnv()

export async function queryAgent(
  prompt: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  const abortController = new AbortController()
  signal.addEventListener('abort', () => abortController.abort(), { once: true })

  for await (const message of query({
    prompt,
    options: {
      systemPrompt: 'You are a helpful assistant. Keep responses concise.',
      allowedTools: [],
      cwd: process.cwd(),
      env,
      abortController
    }
  })) {
    if (message.type === 'assistant') {
      const text = message.message.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { type: string; text: string }) => block.text)
        .join('')
      onChunk(text)
    }
  }
}
