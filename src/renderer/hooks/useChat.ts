import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { trpc } from "../trpc";
import type { ChatMessage, MessagePart, ToolCallState } from "../types";

/** Chunk type as inferred from the tRPC subscription's onData callback. */
type SubscribeOpts = NonNullable<Parameters<typeof trpc.claude.chat.subscribe>[1]>;
type ChatChunk = Parameters<NonNullable<SubscribeOpts["onData"]>>[0];

interface UseChatOptions {
  chatId: string;
  cwd: string;
  model?: string;
}

// --- Pure helper functions (exported for testing) ---

export function updateLastAssistant(
  prev: ChatMessage[],
  assistantId: string,
  updater: (msg: ChatMessage) => ChatMessage,
): ChatMessage[] {
  return prev.map((m) => (m.id === assistantId ? updater(m) : m));
}

export function appendText(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts[parts.length - 1];
  if (last?.type === "text") {
    return [...parts.slice(0, -1), { ...last, text: last.text + delta }];
  }
  return [...parts, { type: "text", id: crypto.randomUUID(), text: delta }];
}

export function updateToolCallChildren(
  parts: MessagePart[],
  parentToolCallId: string,
  updater: (children: MessagePart[]) => MessagePart[],
): MessagePart[] {
  return parts.map((part) =>
    part.type === "tool-call" && part.toolCallId === parentToolCallId
      ? { ...part, children: updater(part.children ?? []) }
      : part,
  );
}

function updateToolCallMeta(
  parts: MessagePart[],
  toolCallId: string,
  meta: Partial<
    Pick<
      Extract<MessagePart, { type: "tool-call" }>,
      "subagentStatus" | "subagentSummary" | "subagentDescription"
    >
  >,
): MessagePart[] {
  return parts.map((part) =>
    part.type === "tool-call" && part.toolCallId === toolCallId
      ? { ...part, ...meta }
      : part,
  );
}

/**
 * Update a specific tool call's properties, handling parent/child branching in one place.
 * If parentId is set, finds the tool call inside that parent's children; otherwise in top-level parts.
 */
export function updateToolCall(
  parts: MessagePart[],
  toolCallId: string,
  parentId: string | null,
  updater: (part: Extract<MessagePart, { type: "tool-call" }>) => MessagePart,
): MessagePart[] {
  const mapToolCall = (list: MessagePart[]) =>
    list.map((part) =>
      part.type === "tool-call" && part.toolCallId === toolCallId ? updater(part) : part,
    );

  if (parentId) {
    return updateToolCallChildren(parts, parentId, mapToolCall);
  }
  return mapToolCall(parts);
}

/**
 * Upsert a tool call: update if it exists, otherwise append a new one.
 * Handles parent/child branching via `parentId`.
 */
export function upsertToolCall(
  parts: MessagePart[],
  parentId: string | null,
  newToolCall: Extract<MessagePart, { type: "tool-call" }>,
): MessagePart[] {
  const upsert = (list: MessagePart[]): MessagePart[] => {
    const exists = list.some(
      (p) => p.type === "tool-call" && p.toolCallId === newToolCall.toolCallId,
    );
    if (exists) {
      return list.map((p) =>
        p.type === "tool-call" && p.toolCallId === newToolCall.toolCallId
          ? { ...p, input: newToolCall.input, state: newToolCall.state }
          : p,
      );
    }
    return [...list, newToolCall];
  };

  if (parentId) {
    return updateToolCallChildren(parts, parentId, upsert);
  }
  return upsert(parts);
}

// --- Chunk handlers ---
// Each handler returns an updater for the assistant message's parts (or the full message).
// This keeps the dispatch map flat and each handler independently testable.

type PartsUpdater = (m: ChatMessage) => ChatMessage;

function handleThinkingStart(): PartsUpdater {
  return (m) => ({
    ...m,
    parts: [
      ...m.parts,
      { type: "thinking" as const, id: crypto.randomUUID(), text: "", isStreaming: true },
    ],
  });
}

function handleThinkingDelta(delta: string): PartsUpdater {
  return (m) => ({
    ...m,
    parts: m.parts.map((p) =>
      p.type === "thinking" && p.isStreaming ? { ...p, text: p.text + delta } : p,
    ),
  });
}

function handleThinkingEnd(): PartsUpdater {
  return (m) => ({
    ...m,
    parts: m.parts.map((p) =>
      p.type === "thinking" && p.isStreaming ? { ...p, isStreaming: false } : p,
    ),
  });
}

function handleTextDelta(delta: string): PartsUpdater {
  return (m) => ({ ...m, parts: appendText(m.parts, delta) });
}

function handleToolInputStart(
  toolCallId: string,
  toolName: string,
  parentId: string | null,
): PartsUpdater {
  const newTool: Extract<MessagePart, { type: "tool-call" }> = {
    type: "tool-call",
    toolCallId,
    toolName,
    input: "",
    state: "streaming-input",
  };
  return (m) => ({
    ...m,
    parts: parentId
      ? updateToolCallChildren(m.parts, parentId, (children) => [...children, newTool])
      : [...m.parts, newTool],
  });
}

function handleToolInputDelta(
  toolCallId: string,
  delta: string,
  parentId: string | null,
): PartsUpdater {
  return (m) => ({
    ...m,
    parts: updateToolCall(m.parts, toolCallId, parentId, (part) => ({
      ...part,
      input: part.input + delta,
    })),
  });
}

function handleToolInputAvailable(
  toolCallId: string,
  toolName: string,
  input: unknown,
  parentId: string | null,
): PartsUpdater {
  return (m) => ({
    ...m,
    parts: upsertToolCall(m.parts, parentId, {
      type: "tool-call",
      toolCallId,
      toolName,
      input: JSON.stringify(input, null, 2),
      state: "running",
    }),
  });
}

function handleToolResult(
  toolCallId: string,
  parentId: string | null,
  update: { output?: string; error?: string; state: ToolCallState },
): PartsUpdater {
  return (m) => ({
    ...m,
    parts: updateToolCall(m.parts, toolCallId, parentId, (part) => ({
      ...part,
      ...update,
    })),
  });
}

function handleSubagentStarted(toolCallId: string, description: string): PartsUpdater {
  return (m) => ({
    ...m,
    parts: updateToolCallMeta(m.parts, toolCallId, {
      subagentStatus: "running",
      subagentDescription: description,
    }),
  });
}

function handleSubagentFinished(
  toolCallId: string,
  status: "completed" | "failed" | "stopped",
  summary: string,
): PartsUpdater {
  return (m) => ({
    ...m,
    parts: updateToolCallMeta(m.parts, toolCallId, {
      subagentStatus: status,
      subagentSummary: summary,
    }),
  });
}

/**
 * Map a ChatChunk to a message updater. Returns null for chunks that don't update parts
 * (finish/error are handled separately because they also update streaming state).
 */
function chunkToUpdater(chunk: ChatChunk): PartsUpdater | null {
  switch (chunk.type) {
    case "thinking-start":
      return handleThinkingStart();
    case "thinking-delta":
      return handleThinkingDelta(chunk.delta);
    case "thinking-end":
      return handleThinkingEnd();
    case "text-delta":
      return handleTextDelta(chunk.delta);
    case "tool-input-start":
      return handleToolInputStart(
        chunk.toolCallId,
        chunk.toolName,
        chunk.parentToolUseId,
      );
    case "tool-input-delta":
      return handleToolInputDelta(chunk.toolCallId, chunk.delta, chunk.parentToolUseId);
    case "tool-input-available":
      return handleToolInputAvailable(
        chunk.toolCallId,
        chunk.toolName,
        chunk.input,
        chunk.parentToolUseId,
      );
    case "tool-output-available":
      return handleToolResult(chunk.toolCallId, chunk.parentToolUseId, {
        output: chunk.output,
        state: "done",
      });
    case "tool-output-error":
      return handleToolResult(chunk.toolCallId, chunk.parentToolUseId, {
        error: chunk.error,
        state: "error",
      });
    case "subagent-started":
      return handleSubagentStarted(chunk.toolCallId, chunk.description);
    case "subagent-finished":
      return handleSubagentFinished(chunk.toolCallId, chunk.status, chunk.summary);
    default:
      return null;
  }
}

// --- Hook ---

export function useChat({ chatId, cwd, model }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const unsubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const messagesRef = useRef<ChatMessage[]>([]);

  messagesRef.current = messages;

  const { isLoading } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      const chat = await trpc.claude.getChat.query({ chatId });
      if (chat?.messages?.length) {
        setMessages(chat.messages as ChatMessage[]);
        const lastAssistant = [...chat.messages]
          .reverse()
          .find((m) => m.role === "assistant");
        if (lastAssistant?.sessionId) {
          sessionIdRef.current = lastAssistant.sessionId;
        }
        if (chat.sessionId) {
          sessionIdRef.current = chat.sessionId;
        }
      }
      return chat;
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isStreaming || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", id: crypto.randomUUID(), text: text.trim() }],
      };

      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        parts: [],
      };

      const currentMessages = messagesRef.current;
      setMessages([...currentMessages, userMsg, assistantMsg]);
      setIsStreaming(true);

      unsubRef.current = trpc.claude.chat.subscribe(
        {
          chatId,
          prompt: text.trim(),
          cwd,
          sessionId: sessionIdRef.current,
          model,
          messages: currentMessages,
        },
        {
          onData(chunk) {
            // Handle finish and error separately (they also control streaming state)
            if (chunk.type === "finish") {
              sessionIdRef.current = chunk.sessionId;
              setMessages((prev) =>
                updateLastAssistant(prev, assistantId, (m) => ({
                  ...m,
                  sessionId: chunk.sessionId,
                  usage: chunk.usage,
                  costUsd: chunk.costUsd,
                  durationMs: chunk.durationMs,
                })),
              );
              setIsStreaming(false);
              unsubRef.current = null;
              return;
            }

            if (chunk.type === "error") {
              setMessages((prev) =>
                updateLastAssistant(prev, assistantId, (m) => ({
                  ...m,
                  error: { message: chunk.message, category: chunk.category },
                  parts:
                    m.parts.length > 0
                      ? m.parts
                      : [
                          {
                            type: "text",
                            id: crypto.randomUUID(),
                            text: `Error: ${chunk.message}`,
                          },
                        ],
                })),
              );
              setIsStreaming(false);
              unsubRef.current = null;
              return;
            }

            // All other chunk types update message parts via the dispatch
            const updater = chunkToUpdater(chunk);
            if (updater) {
              setMessages((prev) => updateLastAssistant(prev, assistantId, updater));
            }
          },
          onError(err) {
            setMessages((prev) =>
              updateLastAssistant(prev, assistantId, (m) => ({
                ...m,
                parts:
                  m.parts.length > 0
                    ? m.parts
                    : [
                        {
                          type: "text",
                          id: crypto.randomUUID(),
                          text: `Error: ${err.message}`,
                        },
                      ],
              })),
            );
            setIsStreaming(false);
            unsubRef.current = null;
          },
        },
      );
    },
    [chatId, cwd, isStreaming, isLoading, model],
  );

  const abort = useCallback(() => {
    unsubRef.current?.unsubscribe();
    unsubRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abort();
    setMessages([]);
    sessionIdRef.current = undefined;
  }, [abort]);

  return { messages, isStreaming, isLoading, sendMessage, abort, reset };
}
