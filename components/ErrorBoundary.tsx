"use client";

import React from "react";

/**
 * Generic error boundary used to isolate feature components.
 * Displays a fallback UI with a retry button that resets the error state.
 * Styling matches RepoLens dark theme with electric‑blue accent.
 */
export class ErrorBoundary extends React.Component<
  { children?: React.ReactNode; fallback?: React.ReactNode; onRetry?: () => void },
  { hasError: boolean; error: unknown }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Never log the token or request details – keep generic.
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded bg-[#0a0a23] text-[#00aaff] border border-[#00aaff]">
          <p className="mb-2">Something went wrong.</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3 py-1 text-sm font-medium bg-[#001f3f] rounded hover:bg-[#003366]"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

