import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeaderBar } from "./header-bar";

const meta: Meta<typeof HeaderBar> = {
  title: "Layout/HeaderBar",
  component: HeaderBar,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof HeaderBar>;

export const Default: Story = {};
