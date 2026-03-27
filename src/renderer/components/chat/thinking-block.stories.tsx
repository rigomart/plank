import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThinkingBlock } from "./thinking-block";

const meta: Meta<typeof ThinkingBlock> = {
  title: "Chat/ThinkingBlock",
  component: ThinkingBlock,
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThinkingBlock>;

export const Streaming: Story = {
  args: {
    text: "Let me analyze the code structure and understand how the components are organized...",
    isStreaming: true,
  },
};

export const Complete: Story = {
  args: {
    text: "I need to look at the ChatPanel component to understand its structure. It currently handles message display, input management, model selection, and scroll behavior all in one component. I should break it down into smaller, focused components:\n\n1. A MessageList for displaying messages\n2. A ChatInput for the text input and controls\n3. An EmptyState for the placeholder\n\nThis will make each piece independently testable and easier to style in Storybook.",
    isStreaming: false,
  },
};

export const Short: Story = {
  args: {
    text: "Checking the file.",
    isStreaming: false,
  },
};
