import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ChatInput } from "./chat-input";

const MODELS = [
  { value: "claude-opus-4-6", displayName: "Opus 4.6" },
  { value: "claude-sonnet-4-6", displayName: "Sonnet 4.6" },
  { value: "claude-haiku-4-5", displayName: "Haiku 4.5" },
];

const meta: Meta<typeof ChatInput> = {
  title: "Chat/ChatInput",
  component: ChatInput,
  args: {
    models: MODELS,
    model: "claude-opus-4-6",
    onModelChange: fn(),
    onSubmit: fn(),
    onAbort: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[700px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatInput>;

export const Default: Story = {
  args: {
    isStreaming: false,
  },
};

export const Streaming: Story = {
  args: {
    isStreaming: true,
  },
};
