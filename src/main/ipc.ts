import type { AnyRouter } from "@trpc/server";
import {
  callProcedure,
  type ProcedureCallOptions,
  type ProcedureType,
} from "@trpc/server/unstable-core-do-not-import";
import { BrowserWindow, ipcMain } from "electron";

interface SubscriptionState {
  abort: AbortController;
}

interface TrpcPayload {
  id: string;
  type: ProcedureType;
  path: string;
  input: unknown;
}

export function createIPCHandler(router: AnyRouter): void {
  const subscriptions = new Map<string, SubscriptionState>();

  ipcMain.handle("trpc", async (event, payload: TrpcPayload) => {
    const { id, type, path, input } = payload;

    const opts: ProcedureCallOptions<unknown> & { router: AnyRouter } = {
      router,
      path,
      getRawInput: async () => input,
      ctx: {},
      type,
      signal: undefined,
      batchIndex: 0,
    };

    if (type === "subscription") {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;

      const abort = new AbortController();
      subscriptions.set(id, { abort });
      opts.signal = abort.signal;

      const iterate = async (): Promise<void> => {
        try {
          const iterable = await callProcedure(opts);

          for await (const item of iterable) {
            if (abort.signal.aborted || win.isDestroyed()) break;
            win.webContents.send("trpc:data", { id, type: "data", data: item });
          }

          if (!win.isDestroyed()) {
            win.webContents.send("trpc:data", { id, type: "end" });
          }
        } catch (err) {
          if (!win.isDestroyed()) {
            const message = err instanceof Error ? err.message : String(err);
            win.webContents.send("trpc:data", { id, type: "error", error: message });
          }
        } finally {
          subscriptions.delete(id);
        }
      };

      iterate();
      return { subscribed: true };
    }

    return callProcedure(opts);
  });

  ipcMain.handle("trpc:unsubscribe", (_event, payload: { id: string }) => {
    const sub = subscriptions.get(payload.id);
    if (sub) {
      sub.abort.abort();
      subscriptions.delete(payload.id);
    }
  });
}
