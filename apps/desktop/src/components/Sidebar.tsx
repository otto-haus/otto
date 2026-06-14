import React from 'react';
import { Icon } from './icons';
import { useRuntimeContext } from '../RuntimeContext';
import ottoAvatar from '../assets/otto-avatar.png';

export type SurfaceId =
  | 'chat'
  | 'charters'
  | 'standards'
  | 'practices'
  | 'routines'
  | 'curation'
  | 'receipts'
  | 'autonomy'
  | 'skills'
  | 'knowledge'
  | 'tickets'
  | 'channels'
  | 'settings';

type NavDef = { id: SurfaceId; label: string; icon: React.ReactNode; shortcut?: string };

const GROUPS: { group?: string; items: NavDef[] }[] = [
  { items: [{ id: 'chat', label: 'Chat', icon: Icon.chat, shortcut: '⌘1' }] },
  {
    group: 'Behavior',
    items: [
      { id: 'charters', label: 'Charters', icon: Icon.charter, shortcut: '⌘2' },
      { id: 'standards', label: 'Standards', icon: Icon.standards, shortcut: '⌘3' },
      { id: 'practices', label: 'Practices', icon: Icon.practices, shortcut: '⌘4' },
      { id: 'routines', label: 'Routines', icon: Icon.routines, shortcut: '⌘5' },
    ],
  },
  {
    group: 'Governance',
    items: [
      { id: 'curation', label: 'Curation', icon: Icon.curation, shortcut: '⌘6' },
      { id: 'receipts', label: 'Receipts', icon: Icon.receipts, shortcut: '⌘7' },
      { id: 'autonomy', label: 'Autonomy', icon: Icon.autonomy, shortcut: '⌘8' },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'skills', label: 'Skills', icon: Icon.owl },
      { id: 'knowledge', label: 'Knowledge', icon: Icon.theme },
      { id: 'tickets', label: 'Tickets', icon: Icon.plus },
      { id: 'channels', label: 'Channels', icon: Icon.send },
    ],
  },
];

export const Sidebar: React.FC<{
  active: SurfaceId;
  onSelect: (id: SurfaceId) => void;
  onNewChat?: () => void;
  counts: Partial<Record<SurfaceId, number>>;
  compact?: boolean;
  onToggleCollapsed: () => void;
}> = ({ active, onSelect, onNewChat, counts, compact = false, onToggleCollapsed }) => {
  const rt = useRuntimeContext();
  // Truthful readiness: only the live runtime can mark connected.
  const connected = rt.electron ? !!rt.status?.ready : false;
  const item = (n: NavDef) => (
    <button type="button"
      key={n.id}
      className={`nav__item has-tip${active === n.id ? ' is-active' : ''}`}
      onClick={() => onSelect(n.id)}
      aria-label={n.label}
      data-tip={n.label}
      data-kbd={n.shortcut}
    >
      <span className="nav__icon">{n.icon}</span>
      <span className="nav__label">{n.label}</span>
      {counts[n.id] ? <span className="nav__badge">{counts[n.id]}</span> : null}
    </button>
  );

  return (
    <aside className={`sidebar${compact ? ' is-collapsed' : ''}`}>
      <div className="brand">
        <span className="brand__mark brand__mark--avatar"><img src={ottoAvatar} alt="" /></span>
        <span className="brand__text">
          <div className="brand__name">otto</div>
        </span>
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
        {GROUPS.map((g) => (
          <React.Fragment key={g.group ?? 'primary'}>
            {g.group && <div className="nav__group">{g.group}</div>}
            {g.items.map(item)}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar__spacer" />

      <button type="button"
        className={`nav__item nav__item--settings has-tip${active === 'settings' ? ' is-active' : ''}`}
        onClick={() => onSelect('settings')}
        aria-label="Settings"
        data-tip="Settings"
        data-kbd="⌘,"
      >
        <span className="nav__icon">{Icon.settings}</span>
        <span className="nav__label">Settings</span>
        {!connected && active !== 'settings' && (
          <span className="nav__badge" style={{ background: 'var(--warn-tint)', color: 'var(--warn)' }}>setup</span>
        )}
      </button>

      <div className="sidebar__foot">
        <div className="row"><span className={`dot ${connected ? 'dot--ok' : 'dot--warn'}`} /> runtime: {connected ? 'connected' : 'not connected'}</div>
        <div className="row">{connected ? (rt.status?.agentId ?? '~/.otto') : 'setup required — see Settings'}</div>
      </div>
    </aside>
  );
};
