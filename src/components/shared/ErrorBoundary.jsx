// src/components/shared/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary__icon">◎</div>
        <h2 className="error-boundary__title">Something went wrong</h2>
        <p className="error-boundary__message">
          {this.state.error?.message || 'An unexpected error occurred'}
        </p>
        <div className="error-boundary__actions">
          <button className="btn btn--primary" onClick={this.handleReset}>
            Try Again
          </button>
          <button className="btn btn--ghost" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
        {import.meta.env.DEV && this.state.errorInfo && (
          <details className="error-boundary__stack">
            <summary>Stack trace (dev)</summary>
            <pre>{this.state.errorInfo.componentStack}</pre>
          </details>
        )}
      </div>
    );
  }
}

/** Inline error state for per-operation errors. */
export function InlineError({ message, onRetry, compact = false }) {
  if (!message) return null;
  return (
    <div className={`inline-error ${compact ? 'inline-error--compact' : ''}`}>
      <span className="inline-error__icon">!</span>
      <span className="inline-error__message">{message}</span>
      {onRetry && (
        <button className="inline-error__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
