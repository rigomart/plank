import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { WorkspaceGroup } from "./workspace-group";

const meta: Meta<typeof WorkspaceGroup> = {
  title: "Sidebar/WorkspaceGroup",
  component: WorkspaceGroup,
  args: {
    onSelectChat: fn(),
    onDeleteChat: fn(),
    onNewChat: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-52 bg-card p-1">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WorkspaceGroup>;

export const WithChats: Story = {
  args: {
    name: "plank",
    repoFullName: "dev/plank",
    activeChatId: "2",
    chats: [
      { id: "1", name: "Set up Storybook" },
      { id: "2", name: "Refactor ChatPanel" },
      { id: "3", name: "Fix build errors" },
    ],
  },
};

export const NoRepo: Story = {
  args: {
    name: "local-project",
    repoFullName: null,
    activeChatId: null,
    chats: [{ id: "1", name: "Initial setup" }],
  },
};

export const Empty: Story = {
  args: {
    name: "new-project",
    repoFullName: "dev/new-project",
    activeChatId: null,
    chats: [],
  },
};
