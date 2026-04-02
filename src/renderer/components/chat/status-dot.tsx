interface StatusDotProps {
  state: "running" | "done" | "error";
}

const STATE_CLASSES: Record<StatusDotProps["state"], string> = {
  running: "bg-muted-foreground animate-pulse",
  done: "hidden",
  error: "bg-destructive",
};

export function StatusDot({ state }: StatusDotProps): React.JSX.Element {
  return (
    <span
      className={`inline-block size-1.5 shrink-0 rounded-full ${STATE_CLASSES[state]}`}
    />
  );
}
