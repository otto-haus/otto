import { useState, useEffect } from 'react';
import type { PracticeSpec, CurationProposal } from '@otto-haus/core';
import practicesData from './data/practices.json';
import { mockApprovals, mockRuns } from './mockData';
import { Sidebar, type SurfaceId } from './components/Sidebar';
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

// Honest per-surface data source: which panes read real files vs sample/prototype data.
const DATA_SOURCE: Partial<Record<SurfaceId, 'file' | 'sample'>> = {
  practices: 'file',
  settings: 'file',
  charters: 'sample',
  standards: 'sample',
  routines: 'sample',
  curation: 'file',
  receipts: 'sample',
  autonomy: 'sample',
};

export function App() {
  const [active, setActiveState] = useState<SurfaceId>(initialSurface());
  const [proposals, setProposals] = useState<CurationProposal[]>([]);

  useEffect(() => {
    const api = window.otto?.curation;
    if (api) {
      api.list().then(setProposals).catch(console.error);
    }
  }, [active]);

  const setActive = (id: SurfaceId) => {
    setActiveState(id);
    if (typeof location !== 'undefined') location.hash = id;
  };
  const counts: Partial<Record<SurfaceId, number>> = {
    practices: (practicesData as PracticeSpec[]).length,
    curation: window.otto?.curation
      ? proposals.filter((p) => p.status === 'pending').length
      : mockApprovals.filter((a) => a.status === 'pending').length,
    receipts: mockRuns.length,
  };

  const meta = META[active];

  return (
    <div className="app">
      <Sidebar active={active} onSelect={setActive} counts={counts} />
      <main className="main">
        {active === 'chat' ? (
          <div className="content content--chat"><Chat /></div>
        ) : (
          <>
            <header className="topbar">
              <div>
                <div className="eyebrow">otto workspace</div>
                <h1>{meta.title}</h1>
                {meta.sub && <div className="topbar__sub">{meta.sub}</div>}
              </div>
              <div className="topbar__right">
                {DATA_SOURCE[active] === 'file' && <span className="pill pill--ok">file-backed</span>}
                {DATA_SOURCE[active] === 'sample' && <span className="pill">sample data</span>}
                <span className="pill pill--info">v0.1 preview</span>
              </div>
            </header>
            <div className="content">{renderSurface(active)}</div>
          </>
        )}
      </main>
    </div>
  );
}
