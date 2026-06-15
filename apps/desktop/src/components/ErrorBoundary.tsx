import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/** Catch renderer crashes so otto never paints a blank white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[otto] renderer error boundary', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error.message || 'Something went wrong in the otto workspace.';
    return (
      <div className="errorBoundary" role="alert">
        <div className="errorBoundary__card">
          <div className="eyebrow">otto</div>
          <h1 className="errorBoundary__title">Workspace hit an error</h1>
          <p className="errorBoundary__body">{message}</p>
          <div className="errorBoundary__actions">
            <button type="button" className="btn btn--solid-d" onClick={this.retry}>
              Reload workspace
            </button>
            <button
              type="button"
              className="btn btn--ghost-d"
              onClick={() => { location.hash = 'settings'; this.retry(); }}
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }
}
