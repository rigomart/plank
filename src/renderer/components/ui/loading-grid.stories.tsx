import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoadingGrid } from "./loading-grid";

const meta: Meta<typeof LoadingGrid> = {
  title: "UI/LoadingGrid",
  component: LoadingGrid,
};

export default meta;
type Story = StoryObj<typeof LoadingGrid>;

export const Default: Story = {};

export const Small: Story = {
  args: { className: "size-3" },
};

export const Large: Story = {
  args: { className: "size-8" },
};

export const Muted: Story = {
  args: { className: "size-4 text-muted-foreground" },
};
