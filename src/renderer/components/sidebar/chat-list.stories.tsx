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
    onAddWorkspace: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatList>;

export const WithWorkspaces: Story = {
  args: {
    activeChatId: "2",
    workspaces: [
      {
        folderPath: "/Users/dev/projects/plank",
        name: "plank",
        repoFullName: "dev/plank",
        chats: [
          { id: "1", name: "Set up Storybook" },
          { id: "2", name: "Refactor ChatPanel" },
          { id: "3", name: "Fix build errors" },
        ],
      },
      {
        folderPath: "/Users/dev/projects/other-app",
        name: "other-app",
        repoFullName: "dev/other-app",
        chats: [
          { id: "4", name: "Add authentication" },
          { id: "5", name: "Database migrations" },
        ],
      },
    ],
  },
};

export const EmptyWorkspace: Story = {
  args: {
    activeChatId: null,
    workspaces: [
      {
        folderPath: "/Users/dev/projects/new-project",
        name: "new-project",
        repoFullName: null,
        chats: [],
      },
    ],
  },
};

export const NoWorkspaces: Story = {
  args: {
    activeChatId: null,
    workspaces: [],
  },
};
