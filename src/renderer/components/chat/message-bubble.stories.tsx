import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ChatMessage } from "../../types";

import { MessageBubble } from "./message-bubble";

const meta: Meta<typeof MessageBubble> = {
  title: "Chat/MessageBubble",
  component: MessageBubble,
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

const userMessage: ChatMessage = {
  id: "1",
  role: "user",
  parts: [
    { type: "text", id: "p1", text: "Can you help me refactor the ChatPanel component?" },
  ],
};

const assistantMessage: ChatMessage = {
  id: "2",
  role: "assistant",
  parts: [
    {
      type: "text",
      id: "p2",
      text: "Sure! I'll break it down into smaller components:\n\n1. **MessageList** — handles rendering messages\n2. **ChatInput** — handles the text input\n3. **EmptyState** — the placeholder when no messages exist",
    },
  ],
  usage: { inputTokens: 500, outputTokens: 120 },
  costUsd: 0.012,
  durationMs: 2300,
};

export const UserMessage: Story = {
  args: {
    message: userMessage,
    isStreaming: false,
  },
};

export const AssistantMessage: Story = {
  args: {
    message: assistantMessage,
    isStreaming: false,
  },
};

export const AssistantStreaming: Story = {
  args: {
    message: {
      id: "3",
      role: "assistant",
      parts: [{ type: "text", id: "p3", text: "Let me look at the code" }],
    },
    isStreaming: true,
  },
};

export const AssistantThinking: Story = {
  args: {
    message: {
      id: "4",
      role: "assistant",
      parts: [],
    },
    isStreaming: true,
  },
};

export const WithToolCall: Story = {
  args: {
    message: {
      id: "5",
      role: "assistant",
      parts: [
        { type: "text", id: "p5", text: "Let me read that file." },
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
          id: "p6",
          text: "I can see the component. Here's my suggestion...",
        },
      ],
    },
    isStreaming: false,
  },
};

export const WithThinking: Story = {
  args: {
    message: {
      id: "6",
      role: "assistant",
      parts: [
        {
          type: "thinking",
          id: "t1",
          text: "The user wants to refactor ChatPanel. I should analyze the current structure and suggest a clean decomposition.",
          isStreaming: false,
        },
        {
          type: "text",
          id: "p7",
          text: "I've analyzed the component and here's what I recommend...",
        },
      ],
    },
    isStreaming: false,
  },
};

export const WithError: Story = {
  args: {
    message: {
      id: "7",
      role: "assistant",
      parts: [{ type: "text", id: "p8", text: "Let me try that..." }],
      error: {
        message: "Rate limit exceeded. Please wait before trying again.",
        category: "rate-limit" as const,
      },
    },
    isStreaming: false,
  },
};

export const AuthError: Story = {
  args: {
    message: {
      id: "8",
      role: "assistant",
      parts: [],
      error: {
        message: "Authentication required",
        category: "auth" as const,
      },
    },
    isStreaming: false,
  },
};
