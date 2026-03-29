import { Check, Copy, Info } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../../types";
import { Button } from "../ui/button";
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
  const hasMetadata = usage != null || costUsd != null || durationMs != null;

  const handleCopy = () => {
    navigator.clipboard.writeText(getMessageMarkdown(message));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="icon-xs" onClick={handleCopy} title="Copy message">
        {copied ? (
          <Check className="size-3 text-emerald-500" />
        ) : (
          <Copy className="size-3 text-muted-foreground" />
        )}
      </Button>
      {hasMetadata && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground text-xs px-1.5"
              title="Message info"
            >
              {durationMs != null ? (
                formatDuration(durationMs)
              ) : (
                <Info className="size-3" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto min-w-40 p-2">
            <div className="flex flex-col gap-1.5 text-xs">
              {usage && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tokens</span>
                  <span className="text-card-foreground">
                    {usage.inputTokens.toLocaleString()} in /{" "}
                    {usage.outputTokens.toLocaleString()} out
                  </span>
                </div>
              )}
              {costUsd != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="text-card-foreground">{formatCost(costUsd)}</span>
                </div>
              )}
              {durationMs != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-card-foreground">
                    {formatDuration(durationMs)}
                  </span>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
