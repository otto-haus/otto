import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './icons';
import { useRuntimeContext } from '../runtime-context';
import { ThreadList, type ThreadSummary } from './ui';
import { OttoMark } from './OttoMark';

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
  | 'terminal'
  | 'settings';

type NavDef = { id: SurfaceId; label: string; icon: React.ReactNode; shortcut?: string };

/** Highest-priority workspace surfaces — always visible in the expanded sidebar. */
const PRIMARY_WORKSPACE_ITEMS: NavDef[] = [
  { id: 'charters', label: 'Charters', icon: Icon.charter, shortcut: '⌘2' },
  { id: 'standards', label: 'Standards', icon: Icon.standards, shortcut: '⌘3' },
  { id: 'practices', label: 'Practices', icon: Icon.practices, shortcut: '⌘4' },
  { id: 'routines', label: 'Routines', icon: Icon.routines, shortcut: '⌘5' },
];

/** Remaining workspace surfaces — behind the collapsible Workspace group. */
const COLLAPSIBLE_WORKSPACE_ITEMS: NavDef[] = [
  { id: 'curation', label: 'Curation', icon: Icon.curation, shortcut: '⌘6' },
  { id: 'receipts', label: 'Receipts', icon: Icon.receipts, shortcut: '⌘7' },
  { id: 'autonomy', label: 'Autonomy', icon: Icon.autonomy, shortcut: '⌘8' },
  { id: 'checks', label: 'Checks', icon: Icon.checks, shortcut: '⌘9' },
  { id: 'skills', label: 'Skills', icon: Icon.skills, shortcut: '⌘0' },
  { id: 'knowledge', label: 'Knowledge', icon: Icon.knowledge, shortcut: '⌘⌥0' },
  { id: 'tickets', label: 'Tickets', icon: Icon.tickets },
  { id: 'channels', label: 'Channels', icon: Icon.send },
  { id: 'terminal', label: 'Terminal', icon: Icon.terminal },
];

const CHAT_ITEM: NavDef = { id: 'chat', label: 'Chat', icon: Icon.chat, shortcut: '⌘1' };

const WORKSPACE_ITEMS: NavDef[] = [...PRIMARY_WORKSPACE_ITEMS, ...COLLAPSIBLE_WORKSPACE_ITEMS];

/**
 * Single source of truth mapping the bare ⌘<digit> shortcuts shown as nav `data-kbd`
 * hints to their surfaces, so App.tsx can wire the keyboard handler without the hints
 * promising navigation that does not exist (#612). Excludes modified shortcuts (e.g. ⌘⌥0).
 */
export const NUMERIC_SURFACE_SHORTCUTS: Record<string, SurfaceId> = Object.fromEntries(
  [CHAT_ITEM, ...WORKSPACE_ITEMS]
    .filter((n): n is NavDef & { shortcut: string } => !!n.shortcut && /^⌘[0-9]$/.test(n.shortcut))
    .map((n) => [n.shortcut.slice(1), n.id]),
);

const COLLAPSIBLE_WORKSPACE_IDS = new Set<SurfaceId>(
  COLLAPSIBLE_WORKSPACE_ITEMS.map((item) => item.id),
);

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
  onPinThread?: (thread: ThreadSummary, pinned: boolean) => void;
  onArchiveThread?: (thread: ThreadSummary) => void;
  onRestoreThread?: (thread: ThreadSummary) => void;
  onRenameThread?: (thread: ThreadSummary, title: string) => void;
  onMoveThread?: (thread: ThreadSummary, target: ThreadSummary) => void;
  showArchived?: boolean;
  hasArchived?: boolean;
  onToggleShowArchived?: (show: boolean) => void;
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
  onPinThread,
  onArchiveThread,
  onRestoreThread,
  onRenameThread,
  onMoveThread,
  showArchived,
  hasArchived,
  onToggleShowArchived,
  isComingSoon,
}) => {
  const rt = useRuntimeContext();
  const connected = rt.electron ? !!rt.status?.ready : false;
  const workspaceActive = COLLAPSIBLE_WORKSPACE_IDS.has(active);

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

  const sidebarToggleLabel = compact ? 'Expand sidebar' : 'Collapse sidebar';

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
          aria-label={sidebarToggleLabel}
          data-tip={sidebarToggleLabel}
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
            {navItem(CHAT_ITEM)}
            {WORKSPACE_ITEMS.map((item) => navItem(item))}
          </>
        ) : (
          <>
            {navItem(CHAT_ITEM)}
            {PRIMARY_WORKSPACE_ITEMS.map((item) => navItem(item))}
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
                <div className="navGroup__items">
                  {COLLAPSIBLE_WORKSPACE_ITEMS.map((item) => navItem(item, true))}
                </div>
              ) : null}
            </div>
          </>
        )}
      </nav>

      <ThreadList
        threads={threads}
        activeThreadId={activeThreadId}
        activeConversationId={activeConversationId}
        showArchived={showArchived}
        hasArchived={hasArchived}
        onToggleShowArchived={onToggleShowArchived}
        onSelect={onSelectThread}
        onPin={onPinThread}
        onArchive={onArchiveThread}
        onRestore={onRestoreThread}
        onRename={onRenameThread}
        onMove={onMoveThread}
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
            <OttoMark size={32} className="ottoMark" dimmed={!connected} />
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
