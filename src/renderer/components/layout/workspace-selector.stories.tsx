import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { WorkspaceSelector } from "./workspace-selector";

const meta: Meta<typeof WorkspaceSelector> = {
  title: "Layout/WorkspaceSelector",
  component: WorkspaceSelector,
  args: {
    onSelectWorkspace: fn(),
    onAddWorkspace: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof WorkspaceSelector>;

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

export const NoRepo: Story = {
  args: {
    workspace: { folderPath: "/Users/dev/projects/local-only", repo: null },
    workspaces: [
      {
        folderPath: "/Users/dev/projects/local-only",
        repo: null,
        addedAt: "2026-03-20",
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
