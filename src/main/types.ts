export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export type ErrorCategory = "auth" | "rate-limit" | "overloaded" | "network" | "generic";

export type ChatChunk =
  // Text streaming
  | { type: "text-start" }
  | { type: "text-delta"; delta: string }
  | { type: "text-end" }
  // Thinking
  | { type: "thinking-start" }
  | { type: "thinking-delta"; delta: string }
  | { type: "thinking-end" }
  // Tool calls
  | {
      type: "tool-input-start";
      toolCallId: string;
      toolName: string;
      parentToolUseId: string | null;
    }
  | {
      type: "tool-input-delta";
      toolCallId: string;
      delta: string;
      parentToolUseId: string | null;
    }
  | {
      type: "tool-input-available";
      toolCallId: string;
      toolName: string;
      input: unknown;
      parentToolUseId: string | null;
    }
  | {
      type: "tool-output-available";
      toolCallId: string;
      output: string;
      parentToolUseId: string | null;
    }
  | {
      type: "tool-output-error";
      toolCallId: string;
      error: string;
      parentToolUseId: string | null;
    }
  // Subagent lifecycle
  | { type: "subagent-started"; toolCallId: string; description: string }
  | {
      type: "subagent-finished";
      toolCallId: string;
      status: "completed" | "failed" | "stopped";
      summary: string;
    }
  // Lifecycle
  | {
      type: "finish";
      sessionId: string;
      usage?: Usage;
      costUsd?: number;
      durationMs?: number;
    }
  | { type: "error"; message: string; category: ErrorCategory };
