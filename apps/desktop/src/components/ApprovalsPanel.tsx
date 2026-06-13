import type { Approval } from '@vinny-os/core';

type ApprovalsPanelProps = {
  approvals: Approval[];
};

export function ApprovalsPanel({ approvals }: ApprovalsPanelProps) {
  return (
    <section className="panel approvals-panel" aria-labelledby="approvals-title">
      <div className="panel__heading panel__heading--row">
        <div>
          <p className="eyebrow">Gates outrank logic</p>
          <h2 id="approvals-title">Approvals</h2>
        </div>
        <span className="count-pill count-pill--warm">{approvals.length} pending</span>
      </div>
      <div className="approval-stack">
        {approvals.map((approval) => (
          <article className="approval-card" key={approval.id}>
            <div className="approval-card__header">
              <strong>{approval.requested_action}</strong>
              <span className="status-badge status-badge--pending">{approval.status}</span>
            </div>
            <p>{approval.evidence_required}</p>
            <dl>
              <div>
                <dt>Scope</dt>
                <dd>{approval.scope}</dd>
              </div>
              <div>
                <dt>Requirement</dt>
                <dd>{approval.requirement}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{new Date(approval.expires_at).toLocaleString()}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
