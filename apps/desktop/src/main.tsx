import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { AppErrorBoundary } from './AppErrorBoundary.js';
import {
  applyDisplayTheme,
  ensureDisplayThemeAuthority,
  readBootDisplayTheme,
  watchSystemDisplayTheme,
} from './display-preferences.js';
import { ottoApi } from './runtime.js';
import './styles.css';

const bootTheme = readBootDisplayTheme();
applyDisplayTheme(bootTheme);
watchSystemDisplayTheme(bootTheme);

const api = ottoApi();
if (api) {
  void ensureDisplayThemeAuthority(api).then((theme) => {
    applyDisplayTheme(theme);
    watchSystemDisplayTheme(theme);
  });
}

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
