import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ChatList } from "./chat-list";

const meta: Meta<typeof ChatList> = {
  title: "Sidebar/ChatList",
  component: ChatList,
  args: {
    onSelectChat: fn(),
    onDeleteChat: fn(),
    onNewChat: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatList>;

export const WithChats: Story = {
  args: {
    activeChatId: "2",
    chats: [
      { id: "1", name: "Set up Storybook" },
      { id: "2", name: "Refactor ChatPanel" },
      { id: "3", name: "Fix build errors" },
      { id: "4", name: "Add dark mode support" },
    ],
  },
};

export const Empty: Story = {
  args: {
    activeChatId: null,
    chats: [],
  },
};

export const ManyChats: Story = {
  args: {
    activeChatId: "1",
    chats: Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      name: `Chat conversation #${i + 1}`,
    })),
  },
};
