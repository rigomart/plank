import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ChatListItem } from "./chat-list-item";

const meta: Meta<typeof ChatListItem> = {
  title: "Sidebar/ChatListItem",
  component: ChatListItem,
  args: {
    onSelect: fn(),
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-52 bg-card p-2">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatListItem>;

export const Default: Story = {
  args: {
    name: "Refactor ChatPanel component",
    isActive: false,
  },
};

export const Active: Story = {
  args: {
    name: "Refactor ChatPanel component",
    isActive: true,
  },
};

export const LongName: Story = {
  args: {
    name: "Help me set up Storybook with Tailwind CSS and React in my Electron app",
    isActive: false,
  },
};
