import { useEffect, useState } from 'react';
import { RuntimeProvider, useRuntimeContext } from './RuntimeContext';
import { ToastProvider } from './components/Toast';
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
  Skills,
  Knowledge,
  Tickets,
  Channels,
  Settings,
} from './surfaces/Panes';
import { Onboarding } from './Onboarding';

const META: Record<SurfaceId, { title: string; sub: string }> = {
  chat: { title: 'Chat', sub: '' },
  charters: { title: 'Charters', sub: 'Operating contracts — bets, acceptance criteria, linked runs and receipts.' },
  standards: { title: 'Standards', sub: 'Explicit canon — what we reward, refuse, and do under pressure.' },
  practices: { title: 'Practices', sub: 'Executable Standards with guardrails and receipt requirements.' },
  routines: { title: 'Routines', sub: 'Repeated bundles of Practices; recurring activation is approval-gated.' },
  curation: { title: 'Curation', sub: 'Proposal-and-ratification queue; Approvals are decision receipts emitted here.' },
  receipts: { title: 'Receipts', sub: 'Proof of work — receipts and run summaries from ~/.otto.' },
  autonomy: { title: 'Autonomy', sub: 'Policy zones, doors, and Knowledge-informed model routing.' },
  skills: { title: 'Skills', sub: 'Reusable capability packages loaded from skill/**/SKILL.md.' },
  knowledge: { title: 'Knowledge', sub: 'AI Frontier model registry — routing Autonomy and ticket workers.' },
  tickets: { title: 'Tickets', sub: 'Bounded worker slices — compile, orchestrate in worktrees, track workers.' },
  channels: { title: 'Channels', sub: 'Reachability surfaces; outbound sends are approval-gated.' },
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
    case 'skills': return <Skills />;
    case 'knowledge': return <Knowledge />;
    case 'tickets': return <Tickets />;
    case 'channels': return <Channels />;
    case 'settings': return <Settings />;
    default: return null;
  }
}

const VALID: SurfaceId[] = ['chat', 'charters', 'standards', 'practices', 'routines', 'curation', 'receipts', 'autonomy', 'skills', 'knowledge', 'tickets', 'channels', 'settings'];
const initialSurface = (): SurfaceId => {
  const h = typeof location !== 'undefined' ? (location.hash.slice(1) as SurfaceId) : 'chat';
  return VALID.includes(h) ? h : 'chat';
};

// Per-surface data source for topbar pills (file-backed canon vs live runtime).
const DATA_SOURCE: Partial<Record<SurfaceId, 'live' | 'coming-soon' | 'file'>> = {
  settings: 'live',
  chat: 'live',
  charters: 'file',
  standards: 'file',
  practices: 'file',
  routines: 'file',
  curation: 'file',
  receipts: 'file',
  autonomy: 'file',
  skills: 'file',
  knowledge: 'file',
  tickets: 'file',
  channels: 'file',
};

export function App() {
  return (
    <RuntimeProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </RuntimeProvider>
  );
}

function AppShell() {
  const rt = useRuntimeContext();
  const [active, setActiveState] = useState<SurfaceId>(initialSurface());
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setSidebarCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1) as SurfaceId;
      if (VALID.includes(h)) setActiveState(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setActive = (id: SurfaceId) => {
    setActiveState(id);
    if (typeof location !== 'undefined') location.hash = id;
  };
  const counts: Partial<Record<SurfaceId, number>> = {};
  const meta = META[active];

  const sourcePill = () => {
    if (active === 'settings' && rt.electron) {
      if (rt.status?.ready) return <span className="pill pill--ok">live runtime</span>;
      if (rt.status) return <span className="pill pill--warn">runtime setup</span>;
      return <span className="pill">connecting runtime</span>;
    }
    if (DATA_SOURCE[active] === 'live') {
      if (rt.electron && rt.status?.ready) return <span className="pill pill--ok">live runtime</span>;
      return <span className="pill pill--warn">runtime setup</span>;
    }
    if (DATA_SOURCE[active] === 'file') return <span className="pill">file-backed</span>;
    if (DATA_SOURCE[active] === 'coming-soon') return <span className="pill">coming soon</span>;
    return null;
  };

  return (
    <>
      <div className={`app${sidebarHidden ? ' app--sidebar-hidden' : ''}${sidebarCompact ? ' app--sidebar-compact' : ''}`}>
        {!sidebarHidden && (
          <Sidebar
            active={active}
            onSelect={setActive}
            onNewChat={() => { void rt.newChat(); }}
            counts={counts}
            compact={sidebarCompact}
            onToggleCollapsed={() => setSidebarHidden(true)}
          />
        )}
        <main className="main">
          {active === 'chat' ? (
            <div className="content content--chat">
              <Chat
                onOpenSettings={() => setActive('settings')}
                onNavigate={setActive}
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
      <Onboarding onNavigate={setActive} />
    </>
  );
}
