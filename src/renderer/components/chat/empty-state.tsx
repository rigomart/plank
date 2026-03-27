interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 pt-32">
      <span className="text-sm font-medium text-card-foreground/60">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );
}
