import type { Meta, StoryObj } from "@storybook/react-vite";

import { MessageActions } from "./message-actions";

const meta: Meta<typeof MessageActions> = {
  title: "Chat/MessageActions",
  component: MessageActions,
};

export default meta;
type Story = StoryObj<typeof MessageActions>;

export const WithMetadata: Story = {
  args: {
    message: {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "text",
          id: "p1",
          text: "Here is some **markdown** content with `code` and a [link](https://example.com).",
        },
      ],
      usage: { inputTokens: 1234, outputTokens: 567 },
      costUsd: 0.0342,
      durationMs: 4500,
    },
  },
};

export const CopyOnly: Story = {
  args: {
    message: {
      id: "2",
      role: "assistant",
      parts: [{ type: "text", id: "p2", text: "A simple response without metadata." }],
    },
  },
};

export const CheapRequest: Story = {
  args: {
    message: {
      id: "3",
      role: "assistant",
      parts: [{ type: "text", id: "p3", text: "Quick answer." }],
      usage: { inputTokens: 50, outputTokens: 12 },
      costUsd: 0.0003,
      durationMs: 320,
    },
  },
};
