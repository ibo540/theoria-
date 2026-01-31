import React from 'react';

interface ErrorBoundaryState {
  error: any;
  errorInfo: any;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: '#fee', color: '#900', borderRadius: 12, margin: 16 }}>
          <h2 style={{ marginBottom: 12, fontSize: 18, fontWeight: 'bold' }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#fff', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            {String(this.state.error)}
            {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

