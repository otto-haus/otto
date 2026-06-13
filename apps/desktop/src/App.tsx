import { useMemo, useState } from 'react';
import type { PracticeSpec } from '@otto-do/core';
import practicesData from './data/practices.json';
import { mockApprovals, mockRuns } from './mockData.js';
import { ApprovalsPanel } from './components/ApprovalsPanel.js';
import { PracticeList } from './components/PracticeList.js';
import { RunsPanel } from './components/RunsPanel.js';

const practices = practicesData as PracticeSpec[];

export function App() {
  const [selectedSlug, setSelectedSlug] = useState<PracticeSpec['slug']>(practices[0]?.slug ?? '');

  const selectedPractice = practices.find((practice) => practice.slug === selectedSlug) ?? practices[0];
  const counts = useMemo(
    () => ({
      active: practices.filter((practice) => practice.status === 'active').length,
      draft: practices.filter((practice) => practice.status === 'draft').length,
    }),
    [],
  );
  const selectedRuns = mockRuns.filter((run) => !selectedPractice || run.practice === selectedPractice.slug);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Otto Desktop</p>
          <h1>Otto — Practices</h1>
        </div>
        <div className="topbar__counts" aria-label="Practice counts">
          <span><strong>{counts.active}</strong> active</span>
          <span><strong>{counts.draft}</strong> draft</span>
        </div>
      </header>

      <section className="hero panel">
        <div>
          <p className="eyebrow">UI = workspace</p>
          <h2>Executable culture, visible from the repo.</h2>
          <p>
            This v0 shell reads Practice specs from disk and shows the operating surface:
            invocations, recent Runs, Receipts, and gated Approvals. No network wiring yet.
          </p>
        </div>
        <div className="hero__terminal" aria-label="Contract invariants">
          <code>Practice → Run → Receipt</code>
          <code>Gate → Approval</code>
          <code>Files = truth</code>
        </div>
      </section>

      <div className="workspace">
        <PracticeList practices={practices} selectedSlug={selectedPractice?.slug ?? ''} onSelect={(practice) => setSelectedSlug(practice.slug)} />

        <section className="detail-grid" aria-label="Selected practice detail">
          {selectedPractice ? (
            <article className="panel practice-detail">
              <div className="panel__heading panel__heading--row">
                <div>
                  <p className="eyebrow">Selected Practice</p>
                  <h2>{selectedPractice.name}</h2>
                </div>
                <span className={`status-badge status-badge--${selectedPractice.status}`}>{selectedPractice.status}</span>
              </div>
              <p className="lede">{selectedPractice.summary}</p>
              <div className="detail-columns">
                <div>
                  <h3>State paths</h3>
                  <ul>
                    {selectedPractice.state_paths.map((path) => <li key={path}>{path}</li>)}
                  </ul>
                </div>
                <div>
                  <h3>Evidence standard</h3>
                  <ul>
                    {selectedPractice.evidence_standard.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <div>
                <h3>Guardrails</h3>
                <ul className="guardrail-list">
                  {selectedPractice.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
                </ul>
              </div>
            </article>
          ) : null}

          <RunsPanel runs={selectedRuns.length > 0 ? selectedRuns : mockRuns} />
          <ApprovalsPanel approvals={mockApprovals.filter((approval) => approval.status === 'pending')} />
        </section>
      </div>
    </main>
  );
}
