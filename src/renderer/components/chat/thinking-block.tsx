import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { LoadingGrid } from "../ui/loading-grid";

function formatThinkingDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 1) return "Thought for less than a second";
  if (seconds === 1) return "Thought for 1 second";
  return `Thought for ${seconds} seconds`;
}

interface ThinkingBlockProps {
  text: string;
  isStreaming: boolean;
}

export function ThinkingBlock({
  text,
  isStreaming,
}: ThinkingBlockProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const startRef = useRef(Date.now());
  const durationRef = useRef<number | null>(null);

  if (isStreaming) {
    startRef.current = Date.now();
    durationRef.current = null;
  } else {
    durationRef.current ??= Date.now() - startRef.current;
  }

  const label = isStreaming
    ? "Thinking"
    : durationRef.current != null
      ? formatThinkingDuration(durationRef.current)
      : "Thinking";

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
        {isStreaming && <LoadingGrid className="size-3 text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <ChevronRight
          className={`ml-auto size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-3 mt-1 border-l border-border pl-3">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
            {text}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
