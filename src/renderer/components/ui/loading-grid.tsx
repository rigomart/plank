import { cn } from "@/lib/utils";

interface LoadingGridProps {
  className?: string;
}

const DOTS = [
  { key: "0-0", cx: 3, cy: 3, delay: 0 },
  { key: "0-1", cx: 8, cy: 3, delay: 150 },
  { key: "0-2", cx: 13, cy: 3, delay: 300 },
  { key: "1-0", cx: 3, cy: 8, delay: 150 },
  { key: "1-1", cx: 8, cy: 8, delay: 300 },
  { key: "1-2", cx: 13, cy: 8, delay: 450 },
  { key: "2-0", cx: 3, cy: 13, delay: 300 },
  { key: "2-1", cx: 8, cy: 13, delay: 450 },
  { key: "2-2", cx: 13, cy: 13, delay: 600 },
];

export function LoadingGrid({ className }: LoadingGridProps): React.JSX.Element {
  return (
    <svg
      role="img"
      aria-label="Loading"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
    >
      {DOTS.map((dot) => (
        <circle
          key={dot.key}
          cx={dot.cx}
          cy={dot.cy}
          r="1.5"
          className="animate-grid-dot"
          style={{ animationDelay: `${dot.delay}ms` }}
        />
      ))}
    </svg>
  );
}
