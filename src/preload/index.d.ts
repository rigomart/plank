import type { ElectronAPI } from '@electron-toolkit/preload'

interface TrpcAPI {
  trpc: (payload: { id: string; type: string; path: string; input: unknown }) => Promise<unknown>
  trpcUnsubscribe: (payload: { id: string }) => Promise<void>
  onTrpcData: (
    callback: (event: { id: string; type: string; data?: unknown; error?: string }) => void
  ) => void
  removeTrpcListeners: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: TrpcAPI
  }
}

export type { AppRouter } from '../main/trpc'
