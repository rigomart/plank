export function HeaderBar(): React.JSX.Element {
  return (
    <header
      className="flex h-11 shrink-0 items-center border-b border-border bg-card px-3"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          P
        </div>
        <span className="text-sm font-medium text-card-foreground">Plank</span>
      </div>
    </header>
  );
}
