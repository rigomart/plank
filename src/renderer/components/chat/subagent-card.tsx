import { Bot, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MessagePart } from "../../types";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { StateIcon, ToolCallCard } from "./tool-call-card";

interface SubagentCardProps {
  toolCallId: string;
  description?: string;
  summary?: string;
  status?: "running" | "completed" | "failed" | "stopped";
  children: MessagePart[];
  input: string;
  output?: string;
}

function getAgentLabel(description?: string, input?: string): string {
  if (description) return description;
  try {
    const parsed = JSON.parse(input ?? "");
    if (parsed.description) return String(parsed.description);
    if (parsed.subagent_type) return String(parsed.subagent_type);
  } catch {}
  return "Agent";
}

export function SubagentCard({
  description,
  summary,
  status,
  children,
  input,
  output,
}: SubagentCardProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const label = getAgentLabel(description, input);
  const isRunning = !status || status === "running";
  const toolCallChildren = children.filter((p) => p.type === "tool-call");

  // Auto-scroll inner container as new tool calls stream in
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on children change
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toolCallChildren.length, open]);

  const collapsedHint =
    !open && (summary || output)
      ? summary || (output && output.length > 120 ? `${output.slice(0, 120)}...` : output)
      : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full">
          <Bot className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium text-card-foreground">Agent</span>
          {isRunning ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : (
            <StateIcon state={status === "completed" ? "done" : "error"} />
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {label}
          </span>
          {!open && collapsedHint && (
            <span className="min-w-0 max-w-[40%] truncate text-[10px] text-muted-foreground/60">
              {collapsedHint}
            </span>
          )}
          <ChevronRight
            className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          ref={scrollRef}
          className="mt-1 max-h-80 space-y-0.5 overflow-y-auto rounded-md border border-border bg-background/50 p-1"
        >
          {toolCallChildren.map((part) => {
            if (part.type !== "tool-call") return null;
            return (
              <ToolCallCard
                key={part.toolCallId}
                toolName={part.toolName}
                toolCallId={part.toolCallId}
                input={part.input}
                output={part.output}
                error={part.error}
                state={part.state}
              />
            );
          })}
          {toolCallChildren.length === 0 && isRunning && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              <span className="text-xs">Starting agent...</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
