'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientCritical } from '@/lib/report-client-critical';

type Props = {
  children: ReactNode;
  /** Shown instead of children after a render crash. */
  fallback?: ReactNode;
  /** Optional label for alerts (e.g. widget id or "admin-shell"). */
  scope?: string;
  apiOrigin?: string;
};

type State = { hasError: boolean; message: string };

/**
 * Catches React render errors. Used in the admin shell and around each embed
 * mount so a single widget crash does not blank the whole host page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Unknown render error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const scope = this.props.scope ?? 'unknown';
    void reportClientCritical({
      title: `React crash: ${scope}`,
      message: error.message,
      fingerprint: `react:${scope}:${error.name}:${error.message.slice(0, 80)}`,
      apiOrigin: this.props.apiOrigin,
      meta: {
        scope,
        stack: error.stack?.slice(0, 2000),
        componentStack: info.componentStack?.slice(0, 2000),
      },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: '#1c1917',
            color: '#fca5a5',
            fontSize: 13,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Something went wrong{this.props.scope ? ` (${this.props.scope})` : ''}.
        </div>
      );
    }
    return this.props.children;
  }
}
