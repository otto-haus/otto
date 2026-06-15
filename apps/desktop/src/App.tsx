import { useEffect, useState } from 'react';
import { RuntimeProvider } from './RuntimeContext';
import { useRuntimeContext } from './runtime-context';
import { ToastProvider } from './components/Toast';
import { Sidebar, type SurfaceId } from './components/Sidebar';
import { Icon } from './components/icons';
import { Chat } from './surfaces/Chat';
import { useChatThreads } from './chat/useChatThreads';
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
import { ChecksSurfaceShell } from './surfaces/ChecksSurfaceShell';
import { Terminal } from './surfaces/Terminal';
import { Onboarding } from './Onboarding';
import { LabsProvider } from './labs/LabsContext';
import { useLabs } from './labs/labs-context';
import { ComingSoonSurface } from './labs/ComingSoonSurface';
import { surfaceGate } from './surface-tiers';
import { EmptyState } from './components/ui';
import { VALID_SURFACES } from './surface-meta';
import { labsCopy } from './copy/surfaces';
import { AppSourceBadge } from './components/AppSourceBadge';
import { isSampleReceiptPreview, SAMPLE_RECEIPT_LABEL } from './onboarding-sample-receipt';
import { useOttoDebugContextMenu } from './debug/useOttoDebugContextMenu';

function renderSurface(id: SurfaceId) {
  switch (id) {
    case 'charters': return <Charters />;
    case 'standards': return <Standards />;
    case 'practices': return <Practices />;
    case 'routines': return <Routines />;
    case 'curation': return <Curation />;
    case 'receipts': return <Receipts />;
    case 'checks': return <ChecksSurfaceShell />;
    case 'autonomy': return <Autonomy />;
    case 'skills': return <Skills />;
    case 'knowledge': return <Knowledge />;
    case 'tickets': return <Tickets />;
    case 'channels': return <Channels />;
    case 'terminal': return <Terminal />;
    case 'settings': return <Settings />;
    default: return null;
  }
}

const VALID = VALID_SURFACES;
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
  checks: 'file',
  autonomy: 'file',
  skills: 'file',
  knowledge: 'file',
  tickets: 'file',
  channels: 'file',
  terminal: 'live',
};

export function App() {
  return (
    <RuntimeProvider>
      <ToastProvider>
        <LabsProvider>
          <AppShell />
        </LabsProvider>
      </ToastProvider>
    </RuntimeProvider>
  );
}

function AppShell() {
  const rt = useRuntimeContext();
  const shellDebugMenu = useOttoDebugContextMenu('shell');
  const labs = useLabs();
  const {
    threads,
    hasArchived,
    showArchived,
    setShowArchived,
    refresh: refreshThreads,
    pinThread,
    restoreThread,
    moveThread,
  } = useChatThreads(rt.activeThreadId);
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'b' || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      setSidebarHidden((hidden) => !hidden);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const setActive = (id: SurfaceId) => {
    setActiveState(id);
    if (typeof location !== 'undefined') location.hash = id;
  };
  const counts: Partial<Record<SurfaceId, number>> = {};

  const openLabsSettings = () => {
    try {
      sessionStorage.setItem('otto.settings.section', 'labs');
    } catch { /* best effort */ }
    setActive('settings');
  };

  const sampleReceiptPreview = active === 'receipts' && isSampleReceiptPreview();

  const sourcePill = () => {
    if (sampleReceiptPreview) return <span className="pill">{SAMPLE_RECEIPT_LABEL}</span>;
    if (labs.isComingSoon(active)) return <span className="pill">coming soon</span>;
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

  const surfaceContent = () => {
    const gate = surfaceGate(active, labs.labs, labs.hydrated);
    if (gate === 'loading') {
      return (
        <div className="comingSoonShell" aria-busy="true">
          <EmptyState eyebrow={labsCopy.eyebrow} title={labsCopy.loadingTitle} body={labsCopy.loadingBody} />
        </div>
      );
    }
    if (gate === 'coming-soon') {
      if (active === 'receipts' && isSampleReceiptPreview()) {
        return renderSurface(active);
      }
      return <ComingSoonSurface id={active} onOpenLabs={openLabsSettings} />;
    }
    return renderSurface(active);
  };

  return (
    <>
      <div className={`app${sidebarHidden ? ' app--sidebar-hidden' : ''}${sidebarCompact ? ' app--sidebar-compact' : ''}`} onContextMenu={shellDebugMenu.onContextMenu}>
        {!sidebarHidden && (
          <Sidebar
            active={active}
            onSelect={setActive}
            onNewChat={() => {
              void rt.newChat().then(() => refreshThreads());
            }}
            counts={counts}
            compact={sidebarCompact}
            onToggleCollapsed={() => setSidebarHidden(true)}
            threads={threads}
            activeThreadId={rt.activeThreadId}
            onSelectThread={(thread) => {
              setActive('chat');
              if (thread.archived) {
                void restoreThread(thread.id)
                  .then(() => rt.switchThread(thread.id))
                  .then(() => refreshThreads());
                return;
              }
              void rt.switchThread(thread.id).then(() => refreshThreads());
            }}
            onPinThread={(thread, pinned) => {
              void pinThread(thread.id, pinned);
            }}
            onMoveThread={(thread, target) => {
              void moveThread(thread.id, target.id);
            }}
            onArchiveThread={(thread) => {
              void rt.archiveThread(thread.id).then(() => refreshThreads());
            }}
            onRestoreThread={(thread) => {
              void restoreThread(thread.id).then(() => refreshThreads());
            }}
            showArchived={showArchived}
            hasArchived={hasArchived}
            onToggleShowArchived={setShowArchived}
            isComingSoon={labs.isComingSoon}
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
              <header className="topbar topbar--slim">
                <div className="topbar__title">
                  {sidebarHidden && (
                    <button type="button" className="topbar__sidebarButton" onClick={() => setSidebarHidden(false)} aria-label="Open sidebar">
                      {Icon.panel}
                    </button>
                  )}
                  <div className="eyebrow">otto workspace</div>
                </div>
                <div className="topbar__right">
                  <AppSourceBadge compact />
                  {sourcePill()}
                </div>
              </header>
              <div className="content">{surfaceContent()}</div>
            </>
          )}
        </main>
      </div>
      <Onboarding onNavigate={setActive} activeSurface={active} />
    </>
  );
}
