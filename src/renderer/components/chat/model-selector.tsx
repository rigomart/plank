import { ChevronDown } from "lucide-react";
import type { ModelOption } from "../../../main/models";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface ModelSelectorProps {
  models: ModelOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  models,
  value,
  onValueChange,
  disabled,
}: ModelSelectorProps): React.JSX.Element {
  const current = models.find((m) => m.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="gap-1 text-xs text-muted-foreground"
          disabled={disabled}
        >
          {current?.displayName ?? value}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {models.map((model) => (
            <DropdownMenuRadioItem
              key={model.value}
              value={model.value}
              className="text-[13px]"
            >
              {model.displayName}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
