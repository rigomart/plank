import type { Meta, StoryObj } from "@storybook/react-vite";

import { MessageList } from "./message-list";

const meta: Meta<typeof MessageList> = {
  title: "Chat/MessageList",
  component: MessageList,
  decorators: [
    (Story) => (
      <div className="h-[500px] w-[700px] overflow-hidden rounded-md border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageList>;

export const Empty: Story = {
  args: {
    messages: [],
    isStreaming: false,
  },
};

export const SingleUserMessage: Story = {
  args: {
    isStreaming: false,
    messages: [
      {
        id: "1",
        role: "user",
        parts: [
          {
            type: "text",
            id: "p1",
            text: "Hello, can you help me with my project?",
          },
        ],
      },
    ],
  },
};

export const Conversation: Story = {
  args: {
    isStreaming: false,
    messages: [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", id: "p1", text: "What does the useChat hook do?" }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [
          {
            type: "text",
            id: "p2",
            text: "The `useChat` hook manages the chat state for a conversation. It handles:\n\n- Loading persisted messages from the database\n- Sending new messages via a tRPC subscription\n- Processing streaming chunks (text, thinking, tool calls)\n- Session resumption across restarts",
          },
        ],
        usage: { inputTokens: 400, outputTokens: 90 },
        costUsd: 0.008,
        durationMs: 1800,
      },
      {
        id: "3",
        role: "user",
        parts: [
          {
            type: "text",
            id: "p3",
            text: "Can you show me the streaming logic?",
          },
        ],
      },
      {
        id: "4",
        role: "assistant",
        parts: [
          {
            type: "tool-call",
            toolCallId: "tc1",
            toolName: "Read",
            input: JSON.stringify(
              { file_path: "/src/renderer/hooks/useChat.ts" },
              null,
              2,
            ),
            output: "export function useChat({ chatId, cwd, model }) { ... }",
            state: "done" as const,
          },
          {
            type: "text",
            id: "p4",
            text: "The streaming works through a tRPC subscription. Each chunk type (`text-delta`, `thinking-start`, `tool-input-delta`, etc.) updates the message state via `setMessages`.",
          },
        ],
        usage: { inputTokens: 1200, outputTokens: 350 },
        costUsd: 0.028,
        durationMs: 4200,
      },
    ],
  },
};

export const Streaming: Story = {
  args: {
    isStreaming: true,
    messages: [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", id: "p1", text: "Explain the IPC bridge." }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [
          {
            type: "text",
            id: "p2",
            text: "The IPC bridge connects the renderer to the main process using",
          },
        ],
      },
    ],
  },
};

export const WaitingForResponse: Story = {
  args: {
    isStreaming: true,
    messages: [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", id: "p1", text: "Refactor the auth module." }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [],
      },
    ],
  },
};

export const Thinking: Story = {
  args: {
    isStreaming: true,
    messages: [
      {
        id: "1",
        role: "user",
        parts: [
          {
            type: "text",
            id: "p1",
            text: "How should I structure error handling?",
          },
        ],
      },
      {
        id: "2",
        role: "assistant",
        parts: [
          {
            type: "text",
            id: "p2",
            text: "Let me check what error handling exists in the codebase first.",
          },
          {
            type: "tool-call",
            toolCallId: "tc1",
            toolName: "Grep",
            input: JSON.stringify(
              { pattern: "catch|ErrorBoundary", path: "src/" },
              null,
              2,
            ),
            output: "src/renderer/trpc.ts:75\nsrc/renderer/hooks/useChat.ts:59",
            state: "done" as const,
          },
        ],
        usage: { inputTokens: 600, outputTokens: 150 },
        costUsd: 0.012,
        durationMs: 2400,
      },
      {
        id: "3",
        role: "user",
        parts: [
          {
            type: "text",
            id: "p3",
            text: "Okay, now add proper error boundaries.",
          },
        ],
      },
      {
        id: "4",
        role: "assistant",
        parts: [
          {
            type: "thinking",
            id: "t1",
            text: "I need to add React error boundaries. The best approach would be:\n1. A generic ErrorBoundary component\n2. Wrap Workbench at the top level\n3. Wrap each ChatPanel individually so one broken chat doesn't affect others\n4. Consider wrapping MessageBubble for resilience against malformed markdown",
            isStreaming: true,
          },
        ],
      },
    ],
  },
};
