import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { AppErrorBoundary } from './AppErrorBoundary.js';
import { applyDisplayTheme, readStoredDisplayTheme, watchSystemDisplayTheme } from './display-preferences.js';
import './styles.css';

applyDisplayTheme(readStoredDisplayTheme());
watchSystemDisplayTheme(readStoredDisplayTheme());

const container = document.getElementById('root') as HTMLElement;

type Root = ReturnType<typeof ReactDOM.createRoot>;

const hotData = import.meta.hot?.data as { root?: Root } | undefined;
let root = hotData?.root;

if (!root) {
  root = ReactDOM.createRoot(container);
  if (import.meta.hot) {
    import.meta.hot.data.root = root;
  }
}

function renderApp() {
  root!.render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>,
  );
}

renderApp();

if (import.meta.hot) {
  import.meta.hot.accept();
}
