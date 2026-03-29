import {
  AlertCircle,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Search,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import type { ToolCallState } from "../../types";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

const TOOL_ICONS: Record<string, typeof Terminal> = {
  Bash: Terminal,
  Read: FileText,
  Write: FileText,
  Edit: Pencil,
  Glob: Search,
  Grep: Search,
  LS: Search,
};

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

export function StateIcon({ state }: { state: ToolCallState }) {
  switch (state) {
    case "streaming-input":
    case "running":
      return <Loader2 className="size-3 animate-spin text-muted-foreground" />;
    case "done":
      return <Check className="size-3 text-emerald-500" />;
    case "error":
      return <AlertCircle className="size-3 text-destructive" />;
  }
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
  const Icon = TOOL_ICONS[toolName] ?? Terminal;
  const summary = toolSummary(toolName, input);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium text-card-foreground">{toolName}</span>
          <StateIcon state={state} />

          {summary && (
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {summary}
            </span>
          )}
          <ChevronRight
            className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-2 rounded-md border border-border bg-background px-3 py-2">
          {input && (
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Input
              </div>
              <pre className="max-h-48 overflow-auto text-[11px] leading-relaxed text-card-foreground">
                {input}
              </pre>
            </div>
          )}
          {output && (
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Output
              </div>
              <pre className="max-h-48 overflow-auto text-[11px] leading-relaxed text-card-foreground">
                {output}
              </pre>
            </div>
          )}
          {error && (
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-destructive">
                Error
              </div>
              <pre className="max-h-48 overflow-auto text-[11px] leading-relaxed text-destructive">
                {error}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
