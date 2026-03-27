import type { ChatMessage } from "../../types";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

interface MessageMetadataProps {
  message: ChatMessage;
}

export function MessageMetadata({
  message,
}: MessageMetadataProps): React.JSX.Element | null {
  const { usage, costUsd, durationMs } = message;
  if (!usage && costUsd == null && durationMs == null) return null;

  const parts: string[] = [];
  if (usage)
    parts.push(
      `${usage.inputTokens.toLocaleString()}in / ${usage.outputTokens.toLocaleString()}out`,
    );
  if (costUsd != null) parts.push(formatCost(costUsd));
  if (durationMs != null) parts.push(formatDuration(durationMs));

  return (
    <div className="mt-1 text-[10px] text-muted-foreground">{parts.join(" · ")}</div>
  );
}
