import {
  createTRPCClient,
  type OperationResultEnvelope,
  type TRPCClientError,
  type TRPCLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../main/trpc";

type TrpcEvent = { id: string; type: string; data?: unknown; error?: string };

interface SubscriptionObserver {
  next: (value: OperationResultEnvelope<unknown, TRPCClientError<AppRouter>>) => void;
  error: (err: TRPCClientError<AppRouter>) => void;
  complete: () => void;
}

const subscribers = new Map<string, SubscriptionObserver>();
let listenerAttached = false;

function ensureListener(): void {
  if (listenerAttached) return;
  listenerAttached = true;
  window.api.onTrpcData((event: TrpcEvent) => {
    const observer = subscribers.get(event.id);
    if (!observer) return;

    if (event.type === "data") {
      observer.next({ result: { type: "data", data: event.data } });
    } else if (event.type === "error") {
      observer.error(
        new Error(
          event.error ?? "Unknown error",
        ) as unknown as TRPCClientError<AppRouter>,
      );
      subscribers.delete(event.id);
    } else if (event.type === "end") {
      observer.complete();
      subscribers.delete(event.id);
    }
  });
}

let nextId = 0;

const ipcLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return observable((observer) => {
      const id = String(++nextId);

      if (op.type === "subscription") {
        ensureListener();
        subscribers.set(id, observer);

        window.api.trpc({
          id,
          type: "subscription",
          path: op.path,
          input: op.input,
        });

        return () => {
          subscribers.delete(id);
          window.api.trpcUnsubscribe({ id });
        };
      }

      // Query or mutation
      window.api
        .trpc({ id, type: op.type, path: op.path, input: op.input })
        .then((result) => {
          observer.next({ result: { type: "data", data: result } });
          observer.complete();
        })
        .catch((err) => observer.error(err));

      return () => {};
    });
  };
};

export const trpc = createTRPCClient<AppRouter>({
  links: [ipcLink],
});
