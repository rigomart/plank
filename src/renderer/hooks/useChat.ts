import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { trpc } from "../trpc";
import type { ChatMessage, MessagePart } from "../types";

interface UseChatOptions {
  chatId: string;
  cwd: string;
  model?: string;
}

function updateLastAssistant(
  prev: ChatMessage[],
  assistantId: string,
  updater: (msg: ChatMessage) => ChatMessage,
): ChatMessage[] {
  return prev.map((m) => (m.id === assistantId ? updater(m) : m));
}

function appendText(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts[parts.length - 1];
  if (last?.type === "text") {
    return [...parts.slice(0, -1), { ...last, text: last.text + delta }];
  }
  return [...parts, { type: "text", id: crypto.randomUUID(), text: delta }];
}

function updateToolCallChildren(
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
      if (!text.trim() || isStreaming) return;

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

      // Read current messages from ref (avoids side effects inside state updater)
      const currentMessages = messagesRef.current;

      // Update state first (pure)
      setMessages([...currentMessages, userMsg, assistantMsg]);
      setIsStreaming(true);

      // Then subscribe (side effect, outside state updater)
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
            switch (chunk.type) {
              case "thinking-start":
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: [
                      ...m.parts,
                      {
                        type: "thinking",
                        id: crypto.randomUUID(),
                        text: "",
                        isStreaming: true,
                      },
                    ],
                  })),
                );
                break;

              case "thinking-delta":
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((p) =>
                      p.type === "thinking" && p.isStreaming
                        ? { ...p, text: p.text + chunk.delta }
                        : p,
                    ),
                  })),
                );
                break;

              case "thinking-end":
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: m.parts.map((p) =>
                      p.type === "thinking" && p.isStreaming
                        ? { ...p, isStreaming: false }
                        : p,
                    ),
                  })),
                );
                break;

              case "text-delta":
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: appendText(m.parts, chunk.delta),
                  })),
                );
                break;

              case "tool-input-start": {
                const parentId = chunk.parentToolUseId;
                if (parentId) {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: updateToolCallChildren(m.parts, parentId, (children) => [
                        ...children,
                        {
                          type: "tool-call" as const,
                          toolCallId: chunk.toolCallId,
                          toolName: chunk.toolName,
                          input: "",
                          state: "streaming-input" as const,
                        },
                      ]),
                    })),
                  );
                } else {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: [
                        ...m.parts,
                        {
                          type: "tool-call",
                          toolCallId: chunk.toolCallId,
                          toolName: chunk.toolName,
                          input: "",
                          state: "streaming-input",
                        },
                      ],
                    })),
                  );
                }
                break;
              }

              case "tool-input-delta": {
                const parentId = chunk.parentToolUseId;
                if (parentId) {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: updateToolCallChildren(m.parts, parentId, (children) =>
                        children.map((part) =>
                          part.type === "tool-call" &&
                          part.toolCallId === chunk.toolCallId
                            ? { ...part, input: part.input + chunk.delta }
                            : part,
                        ),
                      ),
                    })),
                  );
                } else {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: m.parts.map((part) =>
                        part.type === "tool-call" && part.toolCallId === chunk.toolCallId
                          ? { ...part, input: part.input + chunk.delta }
                          : part,
                      ),
                    })),
                  );
                }
                break;
              }

              case "tool-input-available": {
                const parentId = chunk.parentToolUseId;
                if (parentId) {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: updateToolCallChildren(m.parts, parentId, (children) => {
                        const exists = children.some(
                          (part) =>
                            part.type === "tool-call" &&
                            part.toolCallId === chunk.toolCallId,
                        );
                        if (exists) {
                          return children.map((part) =>
                            part.type === "tool-call" &&
                            part.toolCallId === chunk.toolCallId
                              ? {
                                  ...part,
                                  input: JSON.stringify(chunk.input, null, 2),
                                  state: "running" as const,
                                }
                              : part,
                          );
                        }
                        return [
                          ...children,
                          {
                            type: "tool-call" as const,
                            toolCallId: chunk.toolCallId,
                            toolName: chunk.toolName,
                            input: JSON.stringify(chunk.input, null, 2),
                            state: "running" as const,
                          },
                        ];
                      }),
                    })),
                  );
                } else {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => {
                      const exists = m.parts.some(
                        (part) =>
                          part.type === "tool-call" &&
                          part.toolCallId === chunk.toolCallId,
                      );
                      if (exists) {
                        return {
                          ...m,
                          parts: m.parts.map((part) =>
                            part.type === "tool-call" &&
                            part.toolCallId === chunk.toolCallId
                              ? {
                                  ...part,
                                  input: JSON.stringify(chunk.input, null, 2),
                                  state: "running" as const,
                                }
                              : part,
                          ),
                        };
                      }
                      return {
                        ...m,
                        parts: [
                          ...m.parts,
                          {
                            type: "tool-call" as const,
                            toolCallId: chunk.toolCallId,
                            toolName: chunk.toolName,
                            input: JSON.stringify(chunk.input, null, 2),
                            state: "running" as const,
                          },
                        ],
                      };
                    }),
                  );
                }
                break;
              }

              case "tool-output-available": {
                const parentId = chunk.parentToolUseId;
                if (parentId) {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: updateToolCallChildren(m.parts, parentId, (children) =>
                        children.map((part) =>
                          part.type === "tool-call" &&
                          part.toolCallId === chunk.toolCallId
                            ? { ...part, output: chunk.output, state: "done" as const }
                            : part,
                        ),
                      ),
                    })),
                  );
                } else {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: m.parts.map((part) =>
                        part.type === "tool-call" && part.toolCallId === chunk.toolCallId
                          ? { ...part, output: chunk.output, state: "done" as const }
                          : part,
                      ),
                    })),
                  );
                }
                break;
              }

              case "tool-output-error": {
                const parentId = chunk.parentToolUseId;
                if (parentId) {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: updateToolCallChildren(m.parts, parentId, (children) =>
                        children.map((part) =>
                          part.type === "tool-call" &&
                          part.toolCallId === chunk.toolCallId
                            ? { ...part, error: chunk.error, state: "error" as const }
                            : part,
                        ),
                      ),
                    })),
                  );
                } else {
                  setMessages((prev) =>
                    updateLastAssistant(prev, assistantId, (m) => ({
                      ...m,
                      parts: m.parts.map((part) =>
                        part.type === "tool-call" && part.toolCallId === chunk.toolCallId
                          ? { ...part, error: chunk.error, state: "error" as const }
                          : part,
                      ),
                    })),
                  );
                }
                break;
              }

              case "subagent-started":
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: updateToolCallMeta(m.parts, chunk.toolCallId, {
                      subagentStatus: "running",
                      subagentDescription: chunk.description,
                    }),
                  })),
                );
                break;

              case "subagent-finished":
                setMessages((prev) =>
                  updateLastAssistant(prev, assistantId, (m) => ({
                    ...m,
                    parts: updateToolCallMeta(m.parts, chunk.toolCallId, {
                      subagentStatus: chunk.status,
                      subagentSummary: chunk.summary,
                    }),
                  })),
                );
                break;

              case "finish":
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
                break;

              case "error":
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
                break;
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
    [chatId, cwd, isStreaming, model],
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
