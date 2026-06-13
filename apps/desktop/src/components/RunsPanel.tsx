import type { Run } from '@vinny-os/core';

type RunsPanelProps = {
  runs: Run[];
};

export function RunsPanel({ runs }: RunsPanelProps) {
  return (
    <section className="panel" aria-labelledby="runs-title">
      <div className="panel__heading panel__heading--row">
        <div>
          <p className="eyebrow">Observable execution</p>
          <h2 id="runs-title">Runs</h2>
        </div>
        <span className="count-pill">{runs.length}</span>
      </div>
      <div className="run-stack">
        {runs.map((run) => (
          <article className="run-row" key={run.id}>
            <div>
              <div className="run-row__topline">
                <code>{run.invocation}</code>
                <span className={`status-badge status-badge--${run.status}`}>{run.status}</span>
              </div>
              <p>{run.summary}</p>
            </div>
            <div className="run-row__meta">
              <span>{run.practice}</span>
              <span>{run.receipts.length} receipts</span>
              <span>{new Date(run.started_at).toLocaleString()}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
