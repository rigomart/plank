import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { initTRPC, TRPCError } from '@trpc/server'
import { dialog } from 'electron'
import { z } from 'zod'
import { streamChat } from './claude'
import {
  createChat,
  deleteChat,
  getChat,
  listChats,
  type StoredMessage,
  saveMessages,
  updateChatModel
} from './store'
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
    listChats: t.procedure.input(z.object({ workspacePath: z.string() })).query(({ input }) => {
      return listChats(input.workspacePath)
    }),

    getChat: t.procedure.input(z.object({ chatId: z.string() })).query(({ input }) => {
      return getChat(input.chatId)
    }),

    createChat: t.procedure
      .input(z.object({ id: z.string(), workspacePath: z.string() }))
      .mutation(({ input }) => {
        return createChat(input.id, input.workspacePath)
      }),

    deleteChat: t.procedure.input(z.object({ chatId: z.string() })).mutation(({ input }) => {
      deleteChat(input.chatId)
    }),

    updateChatModel: t.procedure
      .input(z.object({ chatId: z.string(), model: z.string() }))
      .mutation(({ input }) => {
        updateChatModel(input.chatId, input.model)
      }),

    chat: t.procedure
      .input(
        z.object({
          chatId: z.string(),
          prompt: z.string(),
          cwd: z.string(),
          sessionId: z.string().optional(),
          model: z.string().optional(),
          messages: z.array(z.unknown()).optional()
        })
      )
      .subscription(async function* ({ input, signal }) {
        // Accumulate the assistant response for persistence
        const existingMessages: StoredMessage[] = (input.messages as StoredMessage[]) ?? []
        const userMsg: StoredMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          parts: [{ type: 'text', id: crypto.randomUUID(), text: input.prompt }]
        }
        const allMessages = [...existingMessages, userMsg]

        // Save user message immediately (persists even if streaming fails)
        saveMessages(input.chatId, allMessages, input.sessionId ?? null)

        const assistantParts: unknown[] = []
        let currentText = ''
        let currentThinking = ''
        let sessionId = input.sessionId ?? null
        let usage: StoredMessage['usage']
        let costUsd: number | undefined

        for await (const chunk of streamChat(input, signal ?? undefined)) {
          yield chunk

          // Accumulate for persistence
          switch (chunk.type) {
            case 'thinking-start':
              currentThinking = ''
              break
            case 'thinking-delta':
              currentThinking += chunk.delta
              break
            case 'thinking-end':
              if (currentThinking) {
                assistantParts.push({
                  type: 'thinking',
                  id: crypto.randomUUID(),
                  text: currentThinking,
                  isStreaming: false
                })
                currentThinking = ''
              }
              break
            case 'text-start':
              currentText = ''
              break
            case 'text-delta':
              currentText += chunk.delta
              break
            case 'text-end':
              if (currentText) {
                assistantParts.push({ type: 'text', id: crypto.randomUUID(), text: currentText })
                currentText = ''
              }
              break
            case 'tool-input-available':
              assistantParts.push({
                type: 'tool-call',
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                input: JSON.stringify(chunk.input, null, 2),
                state: 'running'
              })
              break
            case 'tool-output-available': {
              const tool = assistantParts.find(
                (p): p is { toolCallId: string; output?: string; state: string } =>
                  typeof p === 'object' &&
                  p !== null &&
                  'toolCallId' in p &&
                  (p as { toolCallId: string }).toolCallId === chunk.toolCallId
              )
              if (tool) {
                tool.output = chunk.output
                tool.state = 'done'
              }
              break
            }
            case 'tool-output-error': {
              const errTool = assistantParts.find(
                (p): p is { toolCallId: string; error?: string; state: string } =>
                  typeof p === 'object' &&
                  p !== null &&
                  'toolCallId' in p &&
                  (p as { toolCallId: string }).toolCallId === chunk.toolCallId
              )
              if (errTool) {
                errTool.error = chunk.error
                errTool.state = 'error'
              }
              break
            }
            case 'finish':
              sessionId = chunk.sessionId
              usage = chunk.usage
              costUsd = chunk.costUsd
              // Flush any remaining text
              if (currentText) {
                assistantParts.push({ type: 'text', id: crypto.randomUUID(), text: currentText })
                currentText = ''
              }
              break
          }
        }

        // Save complete assistant message after streaming
        if (assistantParts.length > 0 || sessionId) {
          const assistantMsg: StoredMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            parts: assistantParts,
            sessionId: sessionId ?? undefined,
            usage,
            costUsd
          }
          saveMessages(input.chatId, [...allMessages, assistantMsg], sessionId)
        }
      })
  })
})

export type AppRouter = typeof appRouter
