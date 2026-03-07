import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  trpc: (payload: { id: string; type: string; path: string; input: unknown }): Promise<unknown> =>
    ipcRenderer.invoke('trpc', payload),
  trpcUnsubscribe: (payload: { id: string }): Promise<void> =>
    ipcRenderer.invoke('trpc:unsubscribe', payload),
  onTrpcData: (
    callback: (event: { id: string; type: string; data?: unknown; error?: string }) => void
  ): void => {
    ipcRenderer.on('trpc:data', (_event, data) => callback(data))
  },
  removeTrpcListeners: (): void => {
    ipcRenderer.removeAllListeners('trpc:data')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
