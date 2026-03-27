import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { HeaderBar } from "./header-bar";

const meta: Meta<typeof HeaderBar> = {
  title: "Layout/HeaderBar",
  component: HeaderBar,
  args: {
    onSelectWorkspace: fn(),
    onAddWorkspace: fn(),
    onNewChat: fn(),
  },
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof HeaderBar>;

export const Default: Story = {
  args: {
    workspace: {
      folderPath: "/Users/dev/projects/plank",
      repo: { owner: "dev", repo: "plank", fullName: "dev/plank" },
    },
    workspaces: [
      {
        folderPath: "/Users/dev/projects/plank",
        repo: { owner: "dev", repo: "plank", fullName: "dev/plank" },
        addedAt: "2026-03-20",
      },
      {
        folderPath: "/Users/dev/projects/other-app",
        repo: { owner: "dev", repo: "other-app", fullName: "dev/other-app" },
        addedAt: "2026-03-18",
      },
    ],
  },
};

export const NoWorkspace: Story = {
  args: {
    workspace: null,
    workspaces: [],
  },
};
