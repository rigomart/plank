import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { LoadingGrid } from "../ui/loading-grid";

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
        <Button variant="ghost" size="xs" className="w-full justify-start">
          {isStreaming && <LoadingGrid className="size-3 text-muted-foreground" />}
          <span className="text-sm font-medium text-muted-foreground">Thinking</span>
          <ChevronRight
            className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-md bg-background p-2">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {text}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
