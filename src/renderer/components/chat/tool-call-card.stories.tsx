import type { Meta, StoryObj } from "@storybook/react-vite";

import { ToolCallCard } from "./tool-call-card";

const meta: Meta<typeof ToolCallCard> = {
  title: "Chat/ToolCallCard",
  component: ToolCallCard,
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToolCallCard>;

export const ReadFile: Story = {
  args: {
    toolName: "Read",
    toolCallId: "1",
    input: JSON.stringify(
      { file_path: "/src/renderer/components/ChatPanel.tsx" },
      null,
      2,
    ),
    output:
      'import { useState } from "react";\n\nexport function ChatPanel() {\n  return <div>...</div>;\n}',
    state: "done",
  },
};

export const BashCommand: Story = {
  args: {
    toolName: "Bash",
    toolCallId: "2",
    input: JSON.stringify({ command: "bun run typecheck && bun run build" }, null, 2),
    output: "$ tsc --noEmit\n✓ No errors\n$ electron-vite build\n✓ built in 2.1s",
    state: "done",
  },
};

export const Running: Story = {
  args: {
    toolName: "Bash",
    toolCallId: "3",
    input: JSON.stringify({ command: "bun run build" }, null, 2),
    state: "running",
  },
};

export const StreamingInput: Story = {
  args: {
    toolName: "Edit",
    toolCallId: "4",
    input: '{\n  "file_path": "/src/renderer/compo',
    state: "streaming-input",
  },
};

export const WithError: Story = {
  args: {
    toolName: "Bash",
    toolCallId: "5",
    input: JSON.stringify({ command: "rm -rf node_modules && bun install" }, null, 2),
    error: "Permission denied: cannot remove node_modules/.cache",
    state: "error",
  },
};

export const GrepSearch: Story = {
  args: {
    toolName: "Grep",
    toolCallId: "6",
    input: JSON.stringify({ pattern: "ChatPanel", path: "src/renderer" }, null, 2),
    output:
      "src/renderer/components/Workbench.tsx:4:import { ChatPanel } from './chat';\nsrc/renderer/components/chat/index.tsx:14:export function ChatPanel",
    state: "done",
  },
};
