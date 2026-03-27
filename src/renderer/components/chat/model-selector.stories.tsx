import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ModelSelector } from "./model-selector";

const MODELS = [
  { value: "claude-opus-4-6", displayName: "Opus 4.6" },
  { value: "claude-sonnet-4-6", displayName: "Sonnet 4.6" },
  { value: "claude-haiku-4-5", displayName: "Haiku 4.5" },
];

const meta: Meta<typeof ModelSelector> = {
  title: "Chat/ModelSelector",
  component: ModelSelector,
  args: {
    models: MODELS,
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ModelSelector>;

export const Default: Story = {
  args: {
    value: "claude-opus-4-6",
  },
};

export const Sonnet: Story = {
  args: {
    value: "claude-sonnet-4-6",
  },
};

export const Disabled: Story = {
  args: {
    value: "claude-opus-4-6",
    disabled: true,
  },
};
