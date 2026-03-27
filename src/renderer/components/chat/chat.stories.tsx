import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import type { ChatMessage } from "../../types";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

const MODELS = [
  { value: "claude-opus-4-6", displayName: "Opus 4.6" },
  { value: "claude-sonnet-4-6", displayName: "Sonnet 4.6" },
  { value: "claude-haiku-4-5", displayName: "Haiku 4.5" },
];

function ChatComposed({
  messages,
  isStreaming,
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
}) {
  return (
    <main className="flex h-[600px] flex-col overflow-hidden rounded-md border bg-background">
      <MessageList messages={messages} isStreaming={isStreaming} />
      <ChatInput
        models={MODELS}
        model="claude-opus-4-6"
        onModelChange={fn()}
        isStreaming={isStreaming}
        onSubmit={fn()}
        onAbort={fn()}
      />
    </main>
  );
}

const meta: Meta<typeof ChatComposed> = {
  title: "Chat/Chat",
  component: ChatComposed,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ChatComposed>;

export const Empty: Story = {
  args: {
    messages: [],
    isStreaming: false,
  },
};

export const Conversation: Story = {
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
            text: "Can you help me refactor the ChatPanel component into smaller pieces?",
          },
        ],
      },
      {
        id: "2",
        role: "assistant",
        parts: [
          {
            type: "thinking",
            id: "t1",
            text: "The user wants to decompose ChatPanel. Let me analyze the current structure - it handles messages, input, model selection, and scrolling. I should suggest extracting MessageList, ChatInput, and EmptyState as separate components.",
            isStreaming: false,
          },
          {
            type: "text",
            id: "p2",
            text: "Sure! I'll break the ChatPanel into three components:\n\n1. **MessageList** — displays messages with auto-scroll\n2. **ChatInput** — textarea, model selector, and send button\n3. **EmptyState** — the placeholder when there are no messages\n\nLet me start by reading the current file.",
          },
          {
            type: "tool-call",
            toolCallId: "tc1",
            toolName: "Read",
            input: JSON.stringify(
              { file_path: "/src/renderer/components/ChatPanel.tsx" },
              null,
              2,
            ),
            output: "export function ChatPanel() { ... }",
            state: "done" as const,
          },
          {
            type: "text",
            id: "p3",
            text: "I've read the file. Now I'll create the extracted components.",
          },
        ],
        usage: { inputTokens: 1500, outputTokens: 800 },
        costUsd: 0.045,
        durationMs: 6200,
      },
      {
        id: "3",
        role: "user",
        parts: [{ type: "text", id: "p4", text: "Looks good, go ahead!" }],
      },
      {
        id: "4",
        role: "assistant",
        parts: [
          {
            type: "tool-call",
            toolCallId: "tc2",
            toolName: "Write",
            input: JSON.stringify(
              { file_path: "/src/renderer/components/chat/message-list.tsx" },
              null,
              2,
            ),
            output: "File written successfully",
            state: "done" as const,
          },
          {
            type: "tool-call",
            toolCallId: "tc3",
            toolName: "Write",
            input: JSON.stringify(
              { file_path: "/src/renderer/components/chat/chat-input.tsx" },
              null,
              2,
            ),
            output: "File written successfully",
            state: "done" as const,
          },
          {
            type: "tool-call",
            toolCallId: "tc4",
            toolName: "Bash",
            input: JSON.stringify(
              { command: "bun run typecheck && bun run build" },
              null,
              2,
            ),
            output: "✓ No errors\n✓ built in 2.1s",
            state: "done" as const,
          },
          {
            type: "text",
            id: "p5",
            text: "Done! All three components are created, and typecheck + build pass.",
          },
        ],
        usage: { inputTokens: 3200, outputTokens: 1500 },
        costUsd: 0.098,
        durationMs: 12400,
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
        parts: [
          { type: "text", id: "p1", text: "Explain how the tRPC IPC bridge works." },
        ],
      },
      {
        id: "2",
        role: "assistant",
        parts: [
          {
            type: "text",
            id: "p2",
            text: "The tRPC IPC bridge connects the Electron main process to the renderer. Here's how it works:\n\nThe **main process** creates a tRPC router with all procedures (queries, mutations, subscriptions). An IPC handler listens for",
          },
        ],
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
            text: "What's the best way to handle error boundaries in this app?",
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
            text: "Good question. Let me look at the current error handling patterns in the codebase.",
          },
          {
            type: "tool-call",
            toolCallId: "tc1",
            toolName: "Grep",
            input: JSON.stringify(
              { pattern: "ErrorBoundary", path: "src/renderer" },
              null,
              2,
            ),
            output: "No matches found",
            state: "done" as const,
          },
        ],
        usage: { inputTokens: 800, outputTokens: 200 },
        costUsd: 0.018,
        durationMs: 3100,
      },
      {
        id: "3",
        role: "user",
        parts: [
          {
            type: "text",
            id: "p3",
            text: "Yeah there aren't any yet. Can you add them?",
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
            text: "The user wants me to add error boundaries. I should consider where they'd be most useful:\n\n1. Around the Workbench root — catches any unhandled render errors\n2. Around each ChatPanel — isolates chat rendering failures\n3. Around MessageBubble — prevents a single malformed message from breaking the whole chat\n\nI'll start with a reusable ErrorBoundary component and then wrap the key areas.",
            isStreaming: true,
          },
        ],
      },
    ],
  },
};

export const WithError: Story = {
  args: {
    isStreaming: false,
    messages: [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", id: "p1", text: "Help me fix this bug." }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [],
        error: {
          message: "You have hit the rate limit. Please wait before trying again.",
          category: "rate-limit" as const,
        },
      },
    ],
  },
};
