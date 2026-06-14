import { useState } from 'react';
import { RuntimeProvider } from './RuntimeContext';
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
import { Onboarding } from './Onboarding';

const META: Record<SurfaceId, { title: string; sub: string }> = {
  chat: { title: 'Chat', sub: '' },
  charters: { title: 'Charters', sub: 'Not done yet — real operating contracts will land soon.' },
  standards: { title: 'Standards', sub: 'Not done yet — source-backed Standards will land soon.' },
  practices: { title: 'Practices', sub: 'Not done yet — real Practices will land soon.' },
  routines: { title: 'Routines', sub: 'Not done yet — repeatable bundles will land soon.' },
  curation: { title: 'Curation', sub: 'Not done yet — proposals and approvals will land soon.' },
  receipts: { title: 'Receipts', sub: 'Not done yet — proof and run history will land soon.' },
  autonomy: { title: 'Autonomy', sub: 'Not done yet — policy visibility will land soon.' },
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

// Honest per-surface status: only Settings is live in v0.1; the other workspace panes are placeholders.
const DATA_SOURCE: Partial<Record<SurfaceId, 'live' | 'coming-soon'>> = {
  settings: 'live',
  charters: 'coming-soon',
  standards: 'coming-soon',
  practices: 'coming-soon',
  routines: 'coming-soon',
  curation: 'coming-soon',
  receipts: 'coming-soon',
  autonomy: 'coming-soon',
};

export function App() {
  const [active, setActiveState] = useState<SurfaceId>(initialSurface());
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const setActive = (id: SurfaceId) => {
    setActiveState(id);
    if (typeof location !== 'undefined') location.hash = id;
  };
  const counts: Partial<Record<SurfaceId, number>> = {};
  const meta = META[active];

  return (
    <RuntimeProvider>
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
                {DATA_SOURCE[active] === 'live' && <span className="pill pill--ok">live runtime</span>}
                {DATA_SOURCE[active] === 'coming-soon' && <span className="pill">coming soon</span>}
              </div>
            </header>
            <div className="content">{renderSurface(active)}</div>
          </>
        )}
      </main>
    </div>
    <Onboarding onNavigate={setActive} />
    </RuntimeProvider>
  );
}
