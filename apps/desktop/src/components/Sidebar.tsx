import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './icons';
import { useRuntimeContext } from '../RuntimeContext';
import { ThreadList, type ThreadSummary } from './ui';
import ottoAvatar from '../assets/otto-avatar.png';

export type SurfaceId =
  | 'chat'
  | 'charters'
  | 'standards'
  | 'practices'
  | 'routines'
  | 'curation'
  | 'receipts'
  | 'checks'
  | 'autonomy'
  | 'skills'
  | 'knowledge'
  | 'tickets'
  | 'channels'
  | 'settings';

type NavDef = { id: SurfaceId; label: string; icon: React.ReactNode; shortcut?: string };

const WORKSPACE_ITEMS: NavDef[] = [
  { id: 'charters', label: 'Charters', icon: Icon.charter, shortcut: '⌘2' },
  { id: 'standards', label: 'Standards', icon: Icon.standards, shortcut: '⌘3' },
  { id: 'practices', label: 'Practices', icon: Icon.practices, shortcut: '⌘4' },
  { id: 'routines', label: 'Routines', icon: Icon.routines, shortcut: '⌘5' },
  { id: 'curation', label: 'Curation', icon: Icon.curation, shortcut: '⌘6' },
  { id: 'receipts', label: 'Receipts', icon: Icon.receipts, shortcut: '⌘7' },
  { id: 'checks', label: 'Checks', icon: Icon.check, shortcut: '⌘9' },
  { id: 'autonomy', label: 'Autonomy', icon: Icon.autonomy, shortcut: '⌘8' },
  { id: 'skills', label: 'Skills', icon: Icon.owl },
  { id: 'knowledge', label: 'Knowledge', icon: Icon.theme },
  { id: 'tickets', label: 'Tickets', icon: Icon.plus },
  { id: 'channels', label: 'Channels', icon: Icon.send },
];

const WORKSPACE_IDS = new Set<SurfaceId>(WORKSPACE_ITEMS.map((item) => item.id));

function readWorkspaceOpen(fallback: boolean): boolean {
  try {
    const v = sessionStorage.getItem('otto.sidebar.nav.workspace');
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeWorkspaceOpen(open: boolean) {
  try {
    sessionStorage.setItem('otto.sidebar.nav.workspace', open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export const Sidebar: React.FC<{
  active: SurfaceId;
  onSelect: (id: SurfaceId) => void;
  onNewChat?: () => void;
  counts: Partial<Record<SurfaceId, number>>;
  compact?: boolean;
  onToggleCollapsed: () => void;
  threads?: ThreadSummary[];
  activeThreadId?: string | null;
  activeConversationId?: string | null;
  onSelectThread?: (thread: ThreadSummary) => void;
  isComingSoon?: (id: SurfaceId) => boolean;
}> = ({
  active,
  onSelect,
  onNewChat,
  counts,
  compact = false,
  onToggleCollapsed,
  threads = [],
  activeThreadId,
  activeConversationId,
  onSelectThread,
  isComingSoon,
}) => {
  const rt = useRuntimeContext();
  const connected = rt.electron ? !!rt.status?.ready : false;
  const workspaceActive = WORKSPACE_IDS.has(active);

  const [workspaceOpen, setWorkspaceOpen] = useState(() => readWorkspaceOpen(workspaceActive));

  useEffect(() => {
    if (!workspaceActive) return;
    setWorkspaceOpen((prev) => {
      if (prev) return prev;
      writeWorkspaceOpen(true);
      return true;
    });
  }, [workspaceActive]);

  const toggleWorkspace = () => {
    setWorkspaceOpen((prev) => {
      const next = !prev;
      writeWorkspaceOpen(next);
      return next;
    });
  };

  const profileLine = useMemo(() => {
    if (!connected) return 'Setup required';
    if (rt.status?.model) return rt.status.model;
    return 'Letta session active';
  }, [connected, rt.status?.model]);

  const navItem = (n: NavDef, nested = false) => {
    const soon = isComingSoon?.(n.id) ?? false;
    return (
      <button
        type="button"
        key={n.id}
        className={`nav__item has-tip${nested ? ' nav__item--nested' : ''}${active === n.id ? ' is-active' : ''}${soon ? ' nav__item--soon' : ''}`}
        onClick={() => onSelect(n.id)}
        aria-label={n.label}
        data-tip={n.label}
        data-kbd={n.shortcut}
      >
        <span className="nav__icon">{n.icon}</span>
        <span className="nav__label">{n.label}</span>
        {soon ? <span className="nav__badge nav__badge--soon">soon</span> : null}
        {!soon && counts[n.id] ? <span className="nav__badge">{counts[n.id]}</span> : null}
      </button>
    );
  };

  return (
    <aside className={`sidebar${compact ? ' is-collapsed' : ''}`}>
      <div className="brand">
        <span className="brand__name">otto</span>
        <button
          className="sidebar__toggle has-tip"
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Collapse sidebar"
          data-tip="Collapse sidebar"
          data-kbd="⌘B"
        >
          {Icon.panel}
        </button>
      </div>

      <button
        className="sidebar__primary has-tip"
        type="button"
        onClick={() => {
          onNewChat?.();
          onSelect('chat');
        }}
        aria-label="New chat"
        data-tip="New chat"
        data-kbd="⌘N"
      >
        <span className="sidebar__primaryIcon">{Icon.plus}</span>
        <span className="sidebar__primaryText">New chat</span>
      </button>

      <nav className="nav">
        {compact ? (
          <>
            {navItem({ id: 'chat', label: 'Chat', icon: Icon.chat, shortcut: '⌘1' })}
            {WORKSPACE_ITEMS.map((item) => navItem(item))}
          </>
        ) : (
          <>
            {navItem({ id: 'chat', label: 'Chat', icon: Icon.chat, shortcut: '⌘1' })}
            <div className={`navGroup${workspaceOpen ? ' is-open' : ''}${workspaceActive ? ' is-activeGroup' : ''}`}>
              <button
                type="button"
                className="navGroup__head has-tip"
                onClick={toggleWorkspace}
                aria-expanded={workspaceOpen}
                data-tip="Workspace"
              >
                <span className={`navGroup__chev${workspaceOpen ? ' is-open' : ''}`}>{Icon.chevronRight}</span>
                <span className="navGroup__label">Workspace</span>
              </button>
              {workspaceOpen ? (
                <div className="navGroup__items">{WORKSPACE_ITEMS.map((item) => navItem(item, true))}</div>
              ) : null}
            </div>
          </>
        )}
      </nav>

      <ThreadList
        threads={threads}
        activeThreadId={activeThreadId}
        activeConversationId={activeConversationId}
        onSelect={onSelectThread}
      />

      <div className="sidebar__spacer" />

      <div className="sidebar__lower">
        <button
          type="button"
          className={`nav__item nav__item--settings has-tip${active === 'settings' ? ' is-active' : ''}`}
          onClick={() => onSelect('settings')}
          aria-label="Settings"
          data-tip="Settings"
          data-kbd="⌘,"
        >
          <span className="nav__icon">{Icon.settings}</span>
          <span className="nav__label">Settings</span>
          {!connected && active !== 'settings' ? (
            <span className="nav__badge nav__badge--warn">setup</span>
          ) : null}
        </button>

        <div className="sidebarProfile" aria-label="Operator profile">
          <span className="sidebarProfile__avatar">
            <img src={ottoAvatar} alt="" />
          </span>
          <span className="sidebarProfile__text">
            <span className="sidebarProfile__name">Local operator</span>
            <span className="sidebarProfile__meta">
              <span className={`dot ${connected ? 'dot--ok' : 'dot--warn'}`} />
              {profileLine}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
};
