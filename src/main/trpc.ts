import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { initTRPC, TRPCError } from '@trpc/server'
import { app, dialog } from 'electron'
import { z } from 'zod'
import { clearToken, getSession, pollForToken, startDeviceFlow } from './auth'
import { fetchRepoIssues } from './github'
import { killTerminal, resizeTerminal, spawnTerminal, writeToTerminal } from './pty'
import {
  addWorkspace,
  detectGitRepo,
  loadWorkspaceData,
  removeWorkspace,
  setLastUsed
} from './workspace'

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

  github: t.router({
    issues: t.procedure
      .input(z.object({ owner: z.string(), repo: z.string() }))
      .query(async ({ input }) => {
        const session = await getSession()
        if (!session) throw new Error('Not authenticated')
        return fetchRepoIssues(session.token, input.owner, input.repo)
      })
  }),

  workspace: t.router({
    list: t.procedure.query(() => {
      const data = loadWorkspaceData()
      data.workspaces = data.workspaces.filter((w) => existsSync(w.folderPath))
      return { workspaces: data.workspaces, lastUsedPath: data.lastUsedPath }
    }),

    add: t.procedure.mutation(async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select a git repository folder'
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const folderPath = result.filePaths[0]
      if (!existsSync(join(folderPath, '.git'))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected folder is not a git repository'
        })
      }

      const repo = detectGitRepo(folderPath)
      return addWorkspace(folderPath, repo)
    }),

    remove: t.procedure.input(z.object({ folderPath: z.string() })).mutation(({ input }) => {
      removeWorkspace(input.folderPath)
    }),

    setActive: t.procedure.input(z.object({ folderPath: z.string() })).mutation(({ input }) => {
      setLastUsed(input.folderPath)
      const repo = detectGitRepo(input.folderPath)
      return { folderPath: input.folderPath, repo }
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
