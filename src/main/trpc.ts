import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { queryAgent } from './agent'

const t = initTRPC.create()

export const appRouter = t.router({
  agent: t.router({
    chat: t.procedure.input(z.object({ prompt: z.string() })).subscription(async function* ({
      input,
      signal
    }) {
      const chunks: string[] = []
      let resolve: (() => void) | null = null
      let done = false
      let error: Error | null = null

      queryAgent(input.prompt, signal ?? AbortSignal.timeout(300_000), (text) => {
        chunks.push(text)
        resolve?.()
      })
        .then(() => {
          done = true
          resolve?.()
        })
        .catch((err) => {
          error = err instanceof Error ? err : new Error(String(err))
          done = true
          resolve?.()
        })

      while (!done) {
        if (chunks.length === 0) {
          await new Promise<void>((r) => {
            resolve = r
          })
        }
        while (chunks.length > 0) {
          const text = chunks.shift()
          if (text !== undefined) yield { text }
        }
      }

      if (error) throw error
    })
  })
})

export type AppRouter = typeof appRouter
