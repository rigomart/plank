import type { Meta, StoryObj } from "@storybook/react-vite";

import { EmptyState } from "./empty-state";

const meta: Meta<typeof EmptyState> = {
  title: "Chat/EmptyState",
  component: EmptyState,
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: "Start a conversation",
    description: "Ask Claude to help with your project",
  },
};

export const NoChats: Story = {
  args: {
    title: "No chats yet",
    description: "Create a new chat to get started",
  },
};
