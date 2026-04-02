import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ToolCallState } from "../../types";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { StatusDot } from "./status-dot";

function toolSummary(toolName: string, input: string): string {
  try {
    const parsed = JSON.parse(input);
    if (toolName === "Read" && parsed.file_path) return parsed.file_path;
    if (toolName === "Write" && parsed.file_path) return parsed.file_path;
    if (toolName === "Edit" && parsed.file_path) return parsed.file_path;
    if (toolName === "Bash" && parsed.command) {
      const cmd = String(parsed.command);
      return cmd.length > 80 ? `${cmd.slice(0, 80)}...` : cmd;
    }
    if (toolName === "Glob" && parsed.pattern) return parsed.pattern;
    if (toolName === "Grep" && parsed.pattern) return parsed.pattern;
  } catch {}
  return "";
}

function toDotState(state: ToolCallState): "running" | "done" | "error" {
  if (state === "done") return "done";
  if (state === "error") return "error";
  return "running";
}

interface ToolCallCardProps {
  toolName: string;
  toolCallId: string;
  input: string;
  output?: string;
  error?: string;
  state: ToolCallState;
}

export function ToolCallCard({
  toolName,
  input,
  output,
  error,
  state,
}: ToolCallCardProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const summary = toolSummary(toolName, input);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            className="w-full justify-start gap-1.5 px-1.5"
          />
        }
      >
        <StatusDot state={toDotState(state)} />
        <span className="text-xs font-medium text-card-foreground">{toolName}</span>
        {summary && (
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
            {summary}
          </span>
        )}
        <ChevronRight
          className={`ml-auto size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-3 mt-1 space-y-2 border-l border-border pl-3">
          {input && (
            <pre className="max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
              {input}
            </pre>
          )}
          {output && (
            <pre className="max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-card-foreground">
              {output}
            </pre>
          )}
          {error && (
            <pre className="max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-destructive">
              {error}
            </pre>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
