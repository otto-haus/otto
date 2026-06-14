import { useState } from 'react';
import type { PracticeSpec } from '@otto-haus/core';
import practicesData from './data/practices.json';
import { RuntimeProvider, useRuntimeContext } from './RuntimeContext';
import { Sidebar, type SurfaceId } from './components/Sidebar';
import { Icon } from './components/icons';
import { Chat } from './surfaces/Chat';
import {
  Charters,
  Standards,
  Practices,
  Routines,
  Curation,
  Receipts,
  Autonomy,
  Settings,
} from './surfaces/Panes';

const META: Record<SurfaceId, { title: string; sub: string }> = {
  chat: { title: 'Chat', sub: '' },
  charters: { title: 'Charters', sub: 'Operating contracts — intent compiled into evidence-checked work.' },
  standards: { title: 'Standards', sub: 'The explicit canon: what Otto rewards, refuses, and does under pressure.' },
  practices: { title: 'Practices', sub: 'Executable Standards — validated, repeatable workflows.' },
  routines: { title: 'Routines', sub: 'Repeated bundles of Practices. Recurring activation needs approval.' },
  curation: { title: 'Curation', sub: 'What compounds. Consequential proposals become Approvals.' },
  receipts: { title: 'Receipts', sub: 'Runs and their proof. No artifact, no progress.' },
  autonomy: { title: 'Autonomy', sub: 'What Otto owns without a human in the loop — and what escalates.' },
  settings: { title: 'Settings', sub: 'Setup & readiness — what is configured vs missing.' },
};

function renderSurface(id: SurfaceId) {
  switch (id) {
    case 'charters': return <Charters />;
    case 'standards': return <Standards />;
    case 'practices': return <Practices />;
    case 'routines': return <Routines />;
    case 'curation': return <Curation />;
    case 'receipts': return <Receipts />;
    case 'autonomy': return <Autonomy />;
    case 'settings': return <Settings />;
    default: return null;
  }
}

const VALID: SurfaceId[] = ['chat', 'charters', 'standards', 'practices', 'routines', 'curation', 'receipts', 'autonomy', 'settings'];
const initialSurface = (): SurfaceId => {
  const h = typeof location !== 'undefined' ? (location.hash.slice(1) as SurfaceId) : 'chat';
  return VALID.includes(h) ? h : 'chat';
};

// Honest per-surface data source: a pane is either file-backed/live or not wired.
const DATA_SOURCE: Partial<Record<SurfaceId, 'file' | 'live' | 'not-wired'>> = {
  practices: 'file',
  settings: 'live',
  charters: 'file',
  standards: 'file',
  routines: 'file',
  curation: 'file',
  receipts: 'file',
  autonomy: 'file',
};

export function App() {
  return (
    <RuntimeProvider>
      <AppShell />
    </RuntimeProvider>
  );
}

function AppShell() {
  const rt = useRuntimeContext();
  const [active, setActiveState] = useState<SurfaceId>(initialSurface());
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const setActive = (id: SurfaceId) => {
    setActiveState(id);
    if (typeof location !== 'undefined') location.hash = id;
  };
  const counts: Partial<Record<SurfaceId, number>> = {
    practices: (practicesData as PracticeSpec[]).length,
  };
  const meta = META[active];

  const sourcePill = () => {
    if (active === 'settings' && rt.electron) {
      if (rt.status?.ready) return <span className="pill pill--ok">live runtime</span>;
      if (rt.status) return <span className="pill pill--warn">runtime setup</span>;
      return <span className="pill">connecting runtime</span>;
    }
    if (DATA_SOURCE[active] === 'file') return <span className="pill pill--ok">file-backed</span>;
    if (DATA_SOURCE[active] === 'live') return <span className="pill pill--ok">live runtime</span>;
    if (DATA_SOURCE[active] === 'not-wired') return <span className="pill">not wired</span>;
    return null;
  };

  return (
    <div className={`app${sidebarHidden ? ' app--sidebar-hidden' : ''}`}>
      {!sidebarHidden && (
        <Sidebar
          active={active}
          onSelect={setActive}
          counts={counts}
          onToggleCollapsed={() => setSidebarHidden(true)}
        />
      )}
      <main className="main">
        {active === 'chat' ? (
          <div className="content content--chat">
            <Chat
              onOpenSettings={() => setActive('settings')}
              sidebarHidden={sidebarHidden}
              onToggleSidebar={() => setSidebarHidden(false)}
            />
          </div>
        ) : (
          <>
            <header className="topbar">
              <div className="topbar__title">
                {sidebarHidden && (
                  <button type="button" className="topbar__sidebarButton" onClick={() => setSidebarHidden(false)} aria-label="Open sidebar">
                    {Icon.panel}
                  </button>
                )}
                <div>
                  <div className="eyebrow">otto workspace</div>
                  <h1>{meta.title}</h1>
                  {meta.sub && <div className="topbar__sub">{meta.sub}</div>}
                </div>
              </div>
              <div className="topbar__right">
                {sourcePill()}
              </div>
            </header>
            <div className="content">{renderSurface(active)}</div>
          </>
        )}
      </main>
    </div>
  );
}
