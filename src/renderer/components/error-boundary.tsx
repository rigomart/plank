import { AlertCircle, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-foreground">Something went wrong</h2>
            <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ error: null })}
          >
            <RotateCcw className="mr-1.5 size-3" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface MessageErrorBoundaryProps {
  children: ReactNode;
}

export class MessageErrorBoundary extends Component<
  MessageErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[MessageErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          <AlertCircle className="size-3.5 shrink-0 text-destructive" />
          <span className="text-xs text-muted-foreground">Failed to render message</span>
        </div>
      );
    }

    return this.props.children;
  }
}
