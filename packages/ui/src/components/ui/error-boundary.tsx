"use client";

import { Component, type ComponentType, type PropsWithChildren } from "react";

interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} />;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Something went wrong. Please try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
