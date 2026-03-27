import { Brain, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface ThinkingBlockProps {
  text: string;
  isStreaming: boolean;
}

export function ThinkingBlock({
  text,
  isStreaming,
}: ThinkingBlockProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent"
        >
          <ChevronRight
            className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
          <Brain className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium text-card-foreground">Thinking</span>
          {isStreaming ? (
            <Loader2 className="ml-auto size-3 animate-spin text-muted-foreground" />
          ) : (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {text.length.toLocaleString()} chars
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 rounded-md border border-border bg-background px-3 py-2">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
            {text}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
