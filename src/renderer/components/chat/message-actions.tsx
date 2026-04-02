import { useState } from "react";
import type { ChatMessage } from "../../types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function getMessageMarkdown(message: ChatMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n\n");
}

interface MessageActionsProps {
  message: ChatMessage;
}

export function MessageActions({ message }: MessageActionsProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const { usage, costUsd, durationMs } = message;

  const handleCopy = () => {
    navigator.clipboard.writeText(getMessageMarkdown(message));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-1.5 px-1.5 pt-1 text-[11px] text-muted-foreground/60">
      <button
        type="button"
        onClick={handleCopy}
        className="transition-colors hover:text-muted-foreground"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      {durationMs != null && (
        <>
          <span className="text-border">·</span>
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="transition-colors hover:text-muted-foreground"
                />
              }
            >
              {formatDuration(durationMs)}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto min-w-40 p-2">
              <div className="flex flex-col gap-1.5 text-xs">
                {usage && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">tokens</span>
                    <span className="font-mono text-card-foreground">
                      {usage.inputTokens.toLocaleString()} /{" "}
                      {usage.outputTokens.toLocaleString()}
                    </span>
                  </div>
                )}
                {costUsd != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">cost</span>
                    <span className="font-mono text-card-foreground">
                      {formatCost(costUsd)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">duration</span>
                  <span className="font-mono text-card-foreground">
                    {formatDuration(durationMs)}
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
}
