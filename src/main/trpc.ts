import { initTRPC } from '@trpc/server'
import { app } from 'electron'
import { z } from 'zod'
import { clearToken, getSession, pollForToken, startDeviceFlow } from './auth'
import { killTerminal, resizeTerminal, spawnTerminal, writeToTerminal } from './pty'

const t = initTRPC.create()

export const appRouter = t.router({
  auth: t.router({
    session: t.procedure.query(async () => {
      return await getSession()
    }),

    startDeviceFlow: t.procedure.mutation(async () => {
      return await startDeviceFlow()
    }),

    pollForToken: t.procedure
      .input(z.object({ deviceCode: z.string(), interval: z.number() }))
      .subscription(async function* ({ input, signal }) {
        try {
          const session = await pollForToken(input.deviceCode, input.interval, signal ?? undefined)
          yield { type: 'success' as const, session }
        } catch (err) {
          yield {
            type: 'error' as const,
            message: err instanceof Error ? err.message : String(err)
          }
        }
      }),

    logout: t.procedure.mutation(() => {
      clearToken()
    })
  }),

  terminal: t.router({
    spawn: t.procedure
      .input(
        z.object({
          command: z.string(),
          args: z.array(z.string()).default([]),
          cwd: z.string().optional()
        })
      )
      .subscription(async function* ({ input, signal }) {
        const cwd = input.cwd || app.getPath('home')

        let resolve: (() => void) | null = null
        const chunks: Array<
          { type: 'data'; data: string } | { type: 'exit'; exitCode: number; signal?: number }
        > = []
        let done = false

        const id = spawnTerminal(
          input.command,
          input.args,
          cwd,
          (data) => {
            chunks.push({ type: 'data', data })
            resolve?.()
          },
          (exitCode, sig) => {
            chunks.push({ type: 'exit', exitCode, signal: sig })
            done = true
            resolve?.()
          }
        )

        yield { type: 'started' as const, id }

        signal?.addEventListener('abort', () => {
          killTerminal(id)
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
            const chunk = chunks.shift()
            if (chunk) yield chunk
          }
        }
      }),

    write: t.procedure
      .input(z.object({ id: z.string(), data: z.string() }))
      .mutation(({ input }) => {
        writeToTerminal(input.id, input.data)
      }),

    resize: t.procedure
      .input(z.object({ id: z.string(), cols: z.number(), rows: z.number() }))
      .mutation(({ input }) => {
        resizeTerminal(input.id, input.cols, input.rows)
      }),

    kill: t.procedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      killTerminal(input.id)
    })
  })
})

export type AppRouter = typeof appRouter
