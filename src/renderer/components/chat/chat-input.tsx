import { SendHorizontal, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModelOption } from "../../../main/models";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ModelSelector } from "./model-selector";

interface ChatInputProps {
  models: ModelOption[];
  model: string;
  onModelChange: (model: string) => void;
  isStreaming: boolean;
  onSubmit: (text: string) => void;
  onAbort: () => void;
}

export function ChatInput({
  models,
  model,
  onModelChange,
  isStreaming,
  onSubmit,
  onAbort,
}: ChatInputProps): React.JSX.Element {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    onSubmit(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="shrink-0 px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-md border p-2">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            className="max-h-32 min-h-[36px] resize-none border-none shadow-none focus-visible:ring-0"
            placeholder="Message Claude..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <ModelSelector
            models={models}
            value={model}
            onValueChange={onModelChange}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button variant="outline" size="icon-sm" onClick={onAbort} title="Stop">
              <Square className="size-3.5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim()}
              title="Send"
            >
              <SendHorizontal className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
