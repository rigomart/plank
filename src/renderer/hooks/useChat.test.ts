import { describe, expect, it } from "vitest";
import type { ChatMessage, MessagePart } from "../types";
import {
  appendText,
  updateLastAssistant,
  updateToolCall,
  updateToolCallChildren,
  upsertToolCall,
} from "./useChat";

function makeMsg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return { id: "msg-1", role: "assistant", parts: [], ...overrides };
}

function makeToolCall(
  overrides: Partial<Extract<MessagePart, { type: "tool-call" }>> = {},
): Extract<MessagePart, { type: "tool-call" }> {
  return {
    type: "tool-call",
    toolCallId: "tool-1",
    toolName: "Read",
    input: "",
    state: "running",
    ...overrides,
  };
}

describe("updateLastAssistant", () => {
  it("updates only the message with matching id", () => {
    const messages: ChatMessage[] = [
      makeMsg({ id: "a", parts: [] }),
      makeMsg({ id: "b", parts: [] }),
    ];
    const result = updateLastAssistant(messages, "b", (m) => ({
      ...m,
      parts: [{ type: "text", id: "t1", text: "hello" }],
    }));
    expect(result[0].parts).toHaveLength(0);
    expect(result[1].parts).toHaveLength(1);
    expect(result[1].parts[0]).toMatchObject({ type: "text", text: "hello" });
  });

  it("returns unchanged array if id not found", () => {
    const messages: ChatMessage[] = [makeMsg({ id: "a" })];
    const result = updateLastAssistant(messages, "nonexistent", (m) => ({
      ...m,
      parts: [{ type: "text", id: "t1", text: "hello" }],
    }));
    expect(result[0].parts).toHaveLength(0);
  });
});

describe("appendText", () => {
  it("appends to existing text part", () => {
    const parts: MessagePart[] = [{ type: "text", id: "t1", text: "Hello " }];
    const result = appendText(parts, "world");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "text", text: "Hello world" });
  });

  it("creates new text part when last part is not text", () => {
    const parts: MessagePart[] = [makeToolCall()];
    const result = appendText(parts, "after tool");
    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ type: "text", text: "after tool" });
  });

  it("creates new text part when parts are empty", () => {
    const result = appendText([], "first");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "text", text: "first" });
  });
});

describe("updateToolCallChildren", () => {
  it("updates children of matching tool call", () => {
    const parts: MessagePart[] = [makeToolCall({ toolCallId: "parent-1", children: [] })];
    const result = updateToolCallChildren(parts, "parent-1", (children) => [
      ...children,
      makeToolCall({ toolCallId: "child-1", toolName: "Bash" }),
    ]);
    expect(result[0].type === "tool-call" && result[0].children).toHaveLength(1);
  });

  it("leaves non-matching tool calls unchanged", () => {
    const parts: MessagePart[] = [
      makeToolCall({ toolCallId: "parent-1", children: [] }),
      makeToolCall({ toolCallId: "parent-2", children: [] }),
    ];
    const result = updateToolCallChildren(parts, "parent-1", (children) => [
      ...children,
      makeToolCall({ toolCallId: "child-1" }),
    ]);
    const second = result[1];
    expect(second.type === "tool-call" && second.children).toHaveLength(0);
  });

  it("initializes children array if undefined", () => {
    const parts: MessagePart[] = [makeToolCall({ toolCallId: "parent-1" })];
    const result = updateToolCallChildren(parts, "parent-1", (children) => [
      ...children,
      makeToolCall({ toolCallId: "child-1" }),
    ]);
    const first = result[0];
    expect(first.type === "tool-call" && first.children).toHaveLength(1);
  });
});

describe("updateToolCall", () => {
  it("updates a top-level tool call when parentId is null", () => {
    const parts: MessagePart[] = [makeToolCall({ toolCallId: "t1", input: "old" })];
    const result = updateToolCall(parts, "t1", null, (p) => ({
      ...p,
      input: "new",
    }));
    expect(result[0]).toMatchObject({ toolCallId: "t1", input: "new" });
  });

  it("updates a child tool call when parentId is set", () => {
    const parts: MessagePart[] = [
      makeToolCall({
        toolCallId: "parent",
        children: [makeToolCall({ toolCallId: "child", input: "old" })],
      }),
    ];
    const result = updateToolCall(parts, "child", "parent", (p) => ({
      ...p,
      input: "new",
    }));
    const parent = result[0];
    expect(parent.type === "tool-call" && parent.children?.[0]).toMatchObject({
      toolCallId: "child",
      input: "new",
    });
  });

  it("leaves unrelated tool calls unchanged", () => {
    const parts: MessagePart[] = [
      makeToolCall({ toolCallId: "t1", input: "keep" }),
      makeToolCall({ toolCallId: "t2", input: "old" }),
    ];
    const result = updateToolCall(parts, "t2", null, (p) => ({
      ...p,
      input: "new",
    }));
    expect(result[0]).toMatchObject({ input: "keep" });
    expect(result[1]).toMatchObject({ input: "new" });
  });
});

describe("upsertToolCall", () => {
  it("updates existing tool call if found", () => {
    const parts: MessagePart[] = [
      makeToolCall({ toolCallId: "t1", input: "old", state: "streaming-input" }),
    ];
    const result = upsertToolCall(parts, null, {
      type: "tool-call",
      toolCallId: "t1",
      toolName: "Read",
      input: '{"path": "/foo"}',
      state: "running",
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      toolCallId: "t1",
      input: '{"path": "/foo"}',
      state: "running",
    });
  });

  it("appends new tool call if not found", () => {
    const parts: MessagePart[] = [makeToolCall({ toolCallId: "t1" })];
    const result = upsertToolCall(parts, null, {
      type: "tool-call",
      toolCallId: "t2",
      toolName: "Bash",
      input: "ls",
      state: "running",
    });
    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ toolCallId: "t2", toolName: "Bash" });
  });

  it("upserts into parent children when parentId is set", () => {
    const parts: MessagePart[] = [makeToolCall({ toolCallId: "parent", children: [] })];
    const result = upsertToolCall(parts, "parent", {
      type: "tool-call",
      toolCallId: "child-1",
      toolName: "Read",
      input: "{}",
      state: "running",
    });
    const parent = result[0];
    expect(parent.type === "tool-call" && parent.children).toHaveLength(1);
  });

  it("updates existing child in parent when parentId is set", () => {
    const parts: MessagePart[] = [
      makeToolCall({
        toolCallId: "parent",
        children: [
          makeToolCall({ toolCallId: "child-1", input: "old", state: "streaming-input" }),
        ],
      }),
    ];
    const result = upsertToolCall(parts, "parent", {
      type: "tool-call",
      toolCallId: "child-1",
      toolName: "Read",
      input: "new",
      state: "running",
    });
    const parent = result[0];
    const children = parent.type === "tool-call" ? parent.children : [];
    expect(children).toHaveLength(1);
    expect(children?.[0]).toMatchObject({ input: "new", state: "running" });
  });
});
