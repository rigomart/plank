import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MessagePart } from "../../types";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { StatusDot } from "./status-dot";
import { ToolCallCard } from "./tool-call-card";

interface SubagentCardProps {
  toolCallId: string;
  description?: string;
  status?: "running" | "completed" | "failed" | "stopped";
  children: MessagePart[];
  input: string;
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
  status,
  children,
  input,
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

  const dotState = isRunning ? "running" : status === "completed" ? "done" : "error";

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
        <StatusDot state={dotState} />
        <span className="text-xs font-medium text-card-foreground">Agent</span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {label}
        </span>
        <ChevronRight
          className={`ml-auto size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          ref={scrollRef}
          className="ml-3 mt-1 max-h-80 space-y-0.5 overflow-y-auto border-l border-border pl-1"
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
            <div className="flex items-center gap-1.5 px-1.5 py-1 text-xs text-muted-foreground">
              <StatusDot state="running" />
              <span>Starting...</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
