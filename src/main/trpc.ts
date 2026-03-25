import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { initTRPC, TRPCError } from '@trpc/server'
import { dialog } from 'electron'
import { z } from 'zod'
import { streamChat } from './claude'
import {
  addWorkspace,
  detectGitRepo,
  loadWorkspaceData,
  removeWorkspace,
  setLastUsed
} from './workspace'

const t = initTRPC.create()

export const appRouter = t.router({
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

  claude: t.router({
    chat: t.procedure
      .input(
        z.object({
          chatId: z.string(),
          prompt: z.string(),
          cwd: z.string(),
          sessionId: z.string().optional()
        })
      )
      .subscription(async function* ({ input, signal }) {
        yield* streamChat(input, signal ?? undefined)
      })
  })
})

export type AppRouter = typeof appRouter
