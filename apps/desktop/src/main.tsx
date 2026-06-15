import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './styles.css';
import { isElectron, ottoApi } from './runtime';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[otto] renderer error', error, info);
  }

  onContextMenu = (event: React.MouseEvent) => {
    if (!isElectron()) return;
    event.preventDefault();
    void ottoApi()?.debug?.showContextMenu('renderer-error');
  };

  render() {
    if (this.state.error) {
      return (
        <div id="otto-boot-shell" onContextMenu={this.onContextMenu}>
          <strong>otto failed to load</strong>
          <small>{this.state.error.message}</small>
          <small>Right-click for debug menu (logs, status, DevTools).</small>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
