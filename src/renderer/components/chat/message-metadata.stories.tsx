import type { Meta, StoryObj } from "@storybook/react-vite";

import { MessageMetadata } from "./message-metadata";

const meta: Meta<typeof MessageMetadata> = {
  title: "Chat/MessageMetadata",
  component: MessageMetadata,
};

export default meta;
type Story = StoryObj<typeof MessageMetadata>;

export const Full: Story = {
  args: {
    message: {
      id: "1",
      role: "assistant",
      parts: [],
      usage: { inputTokens: 1234, outputTokens: 567 },
      costUsd: 0.0342,
      durationMs: 4500,
    },
  },
};

export const CheapRequest: Story = {
  args: {
    message: {
      id: "2",
      role: "assistant",
      parts: [],
      usage: { inputTokens: 50, outputTokens: 12 },
      costUsd: 0.0003,
      durationMs: 320,
    },
  },
};

export const UsageOnly: Story = {
  args: {
    message: {
      id: "3",
      role: "assistant",
      parts: [],
      usage: { inputTokens: 8000, outputTokens: 2400 },
    },
  },
};

export const NoMetadata: Story = {
  args: {
    message: {
      id: "4",
      role: "assistant",
      parts: [],
    },
  },
};
