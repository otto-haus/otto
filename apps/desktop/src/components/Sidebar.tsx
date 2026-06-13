import React from 'react';
import { Icon } from './icons';
import { isReady } from '../sampleData';

export type SurfaceId =
  | 'chat'
  | 'charters'
  | 'standards'
  | 'practices'
  | 'routines'
  | 'curation'
  | 'receipts'
  | 'autonomy'
  | 'settings';

type NavDef = { id: SurfaceId; label: string; icon: React.ReactNode };

const GROUPS: { group?: string; items: NavDef[] }[] = [
  { items: [{ id: 'chat', label: 'Chat', icon: Icon.chat }] },
  {
    group: 'Behavior',
    items: [
      { id: 'charters', label: 'Charters', icon: Icon.charter },
      { id: 'standards', label: 'Standards', icon: Icon.standards },
      { id: 'practices', label: 'Practices', icon: Icon.practices },
      { id: 'routines', label: 'Routines', icon: Icon.routines },
    ],
  },
  {
    group: 'Governance',
    items: [
      { id: 'curation', label: 'Curation', icon: Icon.curation },
      { id: 'receipts', label: 'Receipts', icon: Icon.receipts },
      { id: 'autonomy', label: 'Autonomy', icon: Icon.autonomy },
    ],
  },
];

export const Sidebar: React.FC<{
  active: SurfaceId;
  onSelect: (id: SurfaceId) => void;
  counts: Partial<Record<SurfaceId, number>>;
}> = ({ active, onSelect, counts }) => {
  const item = (n: NavDef) => (
    <button
      key={n.id}
      className={`nav__item${active === n.id ? ' is-active' : ''}`}
      onClick={() => onSelect(n.id)}
    >
      <span className="nav__icon">{n.icon}</span>
      <span>{n.label}</span>
      {counts[n.id] ? <span className="nav__badge">{counts[n.id]}</span> : null}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__mark">{Icon.owl}</span>
        <span>
          <div className="brand__name">otto</div>
          <div className="brand__sub">workspace</div>
        </span>
      </div>

      <nav className="nav">
        {GROUPS.map((g, i) => (
          <React.Fragment key={i}>
            {g.group && <div className="nav__group">{g.group}</div>}
            {g.items.map(item)}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar__spacer" />

      <button
        className={`nav__item${active === 'settings' ? ' is-active' : ''}`}
        onClick={() => onSelect('settings')}
      >
        <span className="nav__icon">{Icon.settings}</span>
        <span>Settings</span>
        {!isReady && active !== 'settings' && (
          <span className="nav__badge" style={{ background: 'var(--warn-tint)', color: 'var(--warn)' }}>setup</span>
        )}
      </button>

      <div className="sidebar__foot">
        <div className="row"><span className={`dot ${isReady ? 'dot--ok' : 'dot--warn'}`} /> runtime: {isReady ? 'connected' : 'not connected'}</div>
        <div className="row">{isReady ? '~/.otto' : 'setup required — see Settings'}</div>
      </div>
    </aside>
  );
};
