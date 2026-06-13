import { useState } from 'react';
import type { PracticeSpec } from '@otto-do/core';
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
  settings: { title: 'Settings', sub: 'Runtime, agent, and Letta connection.' },
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

export function App() {
  const [active, setActiveState] = useState<SurfaceId>(initialSurface());
  const setActive = (id: SurfaceId) => {
    setActiveState(id);
    if (typeof location !== 'undefined') location.hash = id;
  };
  const counts: Partial<Record<SurfaceId, number>> = {
    practices: (practicesData as PracticeSpec[]).length,
    curation: mockApprovals.filter((a) => a.status === 'pending').length,
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
