import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { ChatChunk, ErrorCategory } from "./types";

function categorizeError(msg: string): ErrorCategory {
  const lower = msg.toLowerCase();
  if (
    lower.includes("not logged in") ||
    lower.includes("authentication") ||
    lower.includes("invalid_api_key") ||
    lower.includes("invalid api key")
  )
    return "auth";
  if (
    lower.includes("rate_limit") ||
    lower.includes("rate limit") ||
    lower.includes("429")
  )
    return "rate-limit";
  if (lower.includes("overloaded") || lower.includes("503")) return "overloaded";
  if (
    lower.includes("econnrefused") ||
    lower.includes("fetch failed") ||
    lower.includes("network")
  )
    return "network";
  return "generic";
}

export function createTransformer() {
  let textStarted = false;
  let thinkingStarted = false;
  let currentToolCallId: string | null = null;
  let currentToolName: string | null = null;
  let accumulatedToolInput = "";
  let currentParentToolUseId: string | null = null;
  // Track active subagent parent from lifecycle messages.
  // stream_event messages don't carry parent_tool_use_id from the SDK,
  // so we derive it from task_started/task_notification boundaries.
  let activeSubagentParent: string | null = null;
  const emittedToolIds = new Set<string>();

  return function* transform(msg: SDKMessage): Generator<ChatChunk> {
    // Handle system lifecycle messages first to track subagent state
    if (msg.type === "system" && "subtype" in msg) {
      const subtype = msg.subtype as string;
      const toolUseId =
        "tool_use_id" in msg ? (msg.tool_use_id as string | undefined) : undefined;
      if (!toolUseId) return;

      if (subtype === "task_started") {
        activeSubagentParent = toolUseId;
        const description = "description" in msg ? String(msg.description) : "";
        yield { type: "subagent-started", toolCallId: toolUseId, description };
      } else if (subtype === "task_notification") {
        const status =
          "status" in msg
            ? (msg.status as "completed" | "failed" | "stopped")
            : "completed";
        const summary = "summary" in msg ? String(msg.summary) : "";
        yield { type: "subagent-finished", toolCallId: toolUseId, status, summary };
        if (activeSubagentParent === toolUseId) activeSubagentParent = null;
      }
      return;
    }

    if (msg.type === "stream_event") {
      const event = msg.event;
      if (!event) return;

      // SDK doesn't set parent_tool_use_id on stream_events, so fall back
      // to the tracked activeSubagentParent from task_started
      currentParentToolUseId = msg.parent_tool_use_id || activeSubagentParent;

      if (event.type === "content_block_start") {
        const block = event.content_block;
        if (!block) return;

        if (block.type === "thinking") {
          // Suppress subagent thinking (redundant with Agent tool output)
          if (currentParentToolUseId) return;
          thinkingStarted = true;
          yield { type: "thinking-start" };
        } else if (block.type === "text") {
          // Suppress subagent text (redundant with Agent tool output)
          if (currentParentToolUseId) return;
          textStarted = true;
          yield { type: "text-start" };
        } else if (block.type === "tool_use") {
          currentToolCallId = block.id;
          currentToolName = block.name;
          accumulatedToolInput = "";
          emittedToolIds.add(block.id);
          yield {
            type: "tool-input-start",
            toolCallId: block.id,
            toolName: block.name,
            parentToolUseId: currentParentToolUseId,
          };
        }
      } else if (event.type === "content_block_delta") {
        const delta = event.delta;
        if (!delta) return;

        if (delta.type === "thinking_delta" && thinkingStarted) {
          const text = (delta as { thinking?: string }).thinking ?? "";
          if (text) yield { type: "thinking-delta", delta: text };
        } else if (delta.type === "text_delta" && textStarted && delta.text) {
          yield { type: "text-delta", delta: delta.text };
        } else if (delta.type === "input_json_delta" && currentToolCallId) {
          const text = (delta as { partial_json?: string }).partial_json ?? "";
          if (text) {
            accumulatedToolInput += text;
            yield {
              type: "tool-input-delta",
              toolCallId: currentToolCallId,
              delta: text,
              parentToolUseId: currentParentToolUseId,
            };
          }
        }
      } else if (event.type === "content_block_stop") {
        if (thinkingStarted) {
          thinkingStarted = false;
          yield { type: "thinking-end" };
        } else if (textStarted) {
          textStarted = false;
          yield { type: "text-end" };
        } else if (currentToolCallId && currentToolName) {
          let parsed: unknown = accumulatedToolInput;
          try {
            parsed = JSON.parse(accumulatedToolInput);
          } catch {}
          yield {
            type: "tool-input-available",
            toolCallId: currentToolCallId,
            toolName: currentToolName,
            input: parsed,
            parentToolUseId: currentParentToolUseId,
          };
          currentToolCallId = null;
          currentToolName = null;
          accumulatedToolInput = "";
        }
      }
    } else if (msg.type === "assistant") {
      const content = msg.message?.content;
      if (!Array.isArray(content)) return;

      // Check for assistant-level errors
      if (msg.error) {
        yield {
          type: "error",
          message: String(msg.error),
          category: categorizeError(String(msg.error)),
        };
        return;
      }

      const parentId = msg.parent_tool_use_id || activeSubagentParent;
      for (const block of content) {
        if (block.type === "tool_use" && !emittedToolIds.has(block.id)) {
          emittedToolIds.add(block.id);
          yield {
            type: "tool-input-available",
            toolCallId: block.id,
            toolName: block.name,
            input: block.input,
            parentToolUseId: parentId,
          };
        }
      }
    } else if (msg.type === "user") {
      const content = msg.message?.content;
      if (!Array.isArray(content)) return;

      const parentId = msg.parent_tool_use_id || activeSubagentParent;
      for (const block of content) {
        if (block.type !== "tool_result") continue;

        const isError = block.is_error === true;
        const text = extractToolResultText(block.content);

        if (isError) {
          yield {
            type: "tool-output-error",
            toolCallId: block.tool_use_id,
            error: text,
            parentToolUseId: parentId,
          };
        } else {
          yield {
            type: "tool-output-available",
            toolCallId: block.tool_use_id,
            output: text,
            parentToolUseId: parentId,
          };
        }
      }
    } else if (msg.type === "result") {
      if (msg.subtype !== "success") {
        const errors = "errors" in msg ? (msg.errors as string[]) : [];
        const errorMsg = errors.join("; ") || "Claude returned an error";
        yield { type: "error", message: errorMsg, category: categorizeError(errorMsg) };
      }
      yield {
        type: "finish",
        sessionId: msg.session_id ?? "",
        usage: msg.usage
          ? {
              inputTokens: msg.usage.input_tokens ?? 0,
              outputTokens: msg.usage.output_tokens ?? 0,
            }
          : undefined,
        costUsd: msg.total_cost_usd ?? undefined,
        durationMs: msg.duration_ms ?? undefined,
      };
    }
  };
}

function extractToolResultText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "string") return c;
        if (c && typeof c === "object" && "text" in c) return String(c.text);
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}
