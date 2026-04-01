import { describe, expect, it } from "vitest";
import { createTransformer } from "./transform";
import type { ChatChunk } from "./types";

function collect(
  transform: ReturnType<typeof createTransformer>,
  msg: unknown,
): ChatChunk[] {
  return [...transform(msg as Parameters<ReturnType<typeof createTransformer>>[0])];
}

describe("createTransformer", () => {
  describe("thinking blocks", () => {
    it("emits thinking-start, thinking-delta, thinking-end", () => {
      const transform = createTransformer();

      const start = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_start",
          content_block: { type: "thinking" },
        },
      });
      expect(start).toEqual([{ type: "thinking-start" }]);

      const delta = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: { type: "thinking_delta", thinking: "Let me think..." },
        },
      });
      expect(delta).toEqual([{ type: "thinking-delta", delta: "Let me think..." }]);

      const end = collect(transform, {
        type: "stream_event",
        event: { type: "content_block_stop" },
      });
      expect(end).toEqual([{ type: "thinking-end" }]);
    });

    it("suppresses thinking from subagents", () => {
      const transform = createTransformer();

      // Start a subagent
      collect(transform, {
        type: "system",
        subtype: "task_started",
        tool_use_id: "sub-1",
        description: "Subagent",
      });

      const start = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_start",
          content_block: { type: "thinking" },
        },
      });
      expect(start).toEqual([]);
    });
  });

  describe("text blocks", () => {
    it("emits text-start, text-delta, text-end", () => {
      const transform = createTransformer();

      const start = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_start",
          content_block: { type: "text" },
        },
      });
      expect(start).toEqual([{ type: "text-start" }]);

      const delta = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hello" },
        },
      });
      expect(delta).toEqual([{ type: "text-delta", delta: "Hello" }]);

      const end = collect(transform, {
        type: "stream_event",
        event: { type: "content_block_stop" },
      });
      expect(end).toEqual([{ type: "text-end" }]);
    });
  });

  describe("tool calls", () => {
    it("emits tool-input-start, tool-input-delta, tool-input-available", () => {
      const transform = createTransformer();

      const start = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_start",
          content_block: { type: "tool_use", id: "tool-1", name: "Read" },
        },
      });
      expect(start).toEqual([
        {
          type: "tool-input-start",
          toolCallId: "tool-1",
          toolName: "Read",
          parentToolUseId: null,
        },
      ]);

      const delta = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: { type: "input_json_delta", partial_json: '{"path":' },
        },
      });
      expect(delta).toEqual([
        {
          type: "tool-input-delta",
          toolCallId: "tool-1",
          delta: '{"path":',
          parentToolUseId: null,
        },
      ]);

      const delta2 = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: { type: "input_json_delta", partial_json: '"/foo"}' },
        },
      });
      expect(delta2).toHaveLength(1);

      const stop = collect(transform, {
        type: "stream_event",
        event: { type: "content_block_stop" },
      });
      expect(stop).toEqual([
        {
          type: "tool-input-available",
          toolCallId: "tool-1",
          toolName: "Read",
          input: { path: "/foo" },
          parentToolUseId: null,
        },
      ]);
    });

    it("includes parentToolUseId for subagent tool calls", () => {
      const transform = createTransformer();

      collect(transform, {
        type: "system",
        subtype: "task_started",
        tool_use_id: "agent-1",
        description: "Explorer",
      });

      const start = collect(transform, {
        type: "stream_event",
        event: {
          type: "content_block_start",
          content_block: { type: "tool_use", id: "tool-2", name: "Bash" },
        },
      });
      expect(start[0]).toMatchObject({
        type: "tool-input-start",
        parentToolUseId: "agent-1",
      });
    });
  });

  describe("tool results", () => {
    it("emits tool-output-available for successful results", () => {
      const transform = createTransformer();

      const chunks = collect(transform, {
        type: "user",
        message: {
          content: [
            { type: "tool_result", tool_use_id: "tool-1", content: "file contents here" },
          ],
        },
      });
      expect(chunks).toEqual([
        {
          type: "tool-output-available",
          toolCallId: "tool-1",
          output: "file contents here",
          parentToolUseId: null,
        },
      ]);
    });

    it("emits tool-output-error for error results", () => {
      const transform = createTransformer();

      const chunks = collect(transform, {
        type: "user",
        message: {
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool-1",
              is_error: true,
              content: "file not found",
            },
          ],
        },
      });
      expect(chunks).toEqual([
        {
          type: "tool-output-error",
          toolCallId: "tool-1",
          error: "file not found",
          parentToolUseId: null,
        },
      ]);
    });
  });

  describe("subagent lifecycle", () => {
    it("emits subagent-started and subagent-finished", () => {
      const transform = createTransformer();

      const started = collect(transform, {
        type: "system",
        subtype: "task_started",
        tool_use_id: "agent-1",
        description: "Exploring codebase",
      });
      expect(started).toEqual([
        {
          type: "subagent-started",
          toolCallId: "agent-1",
          description: "Exploring codebase",
        },
      ]);

      const finished = collect(transform, {
        type: "system",
        subtype: "task_notification",
        tool_use_id: "agent-1",
        status: "completed",
        summary: "Found 5 files",
      });
      expect(finished).toEqual([
        {
          type: "subagent-finished",
          toolCallId: "agent-1",
          status: "completed",
          summary: "Found 5 files",
        },
      ]);
    });
  });

  describe("error categorization", () => {
    it("categorizes authentication errors", () => {
      const transform = createTransformer();
      const chunks = collect(transform, {
        type: "result",
        subtype: "error",
        errors: ["not logged in to Claude"],
      });
      const errorChunk = chunks.find((c) => c.type === "error");
      expect(errorChunk).toMatchObject({ category: "auth" });
    });

    it("categorizes rate limit errors", () => {
      const transform = createTransformer();
      const chunks = collect(transform, {
        type: "result",
        subtype: "error",
        errors: ["rate_limit exceeded"],
      });
      const errorChunk = chunks.find((c) => c.type === "error");
      expect(errorChunk).toMatchObject({ category: "rate-limit" });
    });

    it("categorizes network errors", () => {
      const transform = createTransformer();
      const chunks = collect(transform, {
        type: "result",
        subtype: "error",
        errors: ["fetch failed"],
      });
      const errorChunk = chunks.find((c) => c.type === "error");
      expect(errorChunk).toMatchObject({ category: "network" });
    });

    it("falls back to generic for unknown errors", () => {
      const transform = createTransformer();
      const chunks = collect(transform, {
        type: "result",
        subtype: "error",
        errors: ["something weird happened"],
      });
      const errorChunk = chunks.find((c) => c.type === "error");
      expect(errorChunk).toMatchObject({ category: "generic" });
    });
  });

  describe("finish", () => {
    it("emits finish with session and usage data", () => {
      const transform = createTransformer();
      const chunks = collect(transform, {
        type: "result",
        subtype: "success",
        session_id: "sess-123",
        usage: { input_tokens: 100, output_tokens: 50 },
        total_cost_usd: 0.005,
        duration_ms: 2500,
      });
      expect(chunks).toEqual([
        {
          type: "finish",
          sessionId: "sess-123",
          usage: { inputTokens: 100, outputTokens: 50 },
          costUsd: 0.005,
          durationMs: 2500,
        },
      ]);
    });

    it("emits error then finish for failed results", () => {
      const transform = createTransformer();
      const chunks = collect(transform, {
        type: "result",
        subtype: "error",
        errors: ["overloaded"],
        session_id: "sess-456",
      });
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toMatchObject({ type: "error", category: "overloaded" });
      expect(chunks[1]).toMatchObject({ type: "finish", sessionId: "sess-456" });
    });
  });
});
