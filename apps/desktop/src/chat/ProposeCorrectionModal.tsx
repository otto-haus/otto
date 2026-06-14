import React, { useEffect, useState } from 'react';
import type { ProposalCanonImpact, ProposalClassification, ProposalTarget } from '@otto-haus/core';
import { Modal } from '../components/ui/Modal';
import { chatCopy } from '../copy/surfaces';

const TARGET_OPTIONS: Array<{ kind: ProposalCanonImpact | 'task'; label: string }> = [
  { kind: 'standard', label: 'Standard' },
  { kind: 'practice', label: 'Practice' },
  { kind: 'routine', label: 'Routine' },
  { kind: 'memory', label: 'Memory writeback' },
  { kind: 'knowledge', label: 'Knowledge' },
  { kind: 'task', label: 'Task (no canon change)' },
];

export type ProposeCorrectionContext = {
  messageId: string;
  messageText: string;
  who: 'user' | 'otto';
};

export const ProposeCorrectionModal: React.FC<{
  open: boolean;
  context: ProposeCorrectionContext | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: { correction: string; target: ProposalTarget; rationale: string }) => void;
  classify?: (input: { correction: string; target: ProposalTarget }) => Promise<ProposalClassification>;
}> = ({ open, context, busy = false, onClose, onSubmit, classify }) => {
  const [correction, setCorrection] = useState('');
  const [rationale, setRationale] = useState('');
  const [targetKind, setTargetKind] = useState<ProposalCanonImpact | 'task'>('standard');
  const [preview, setPreview] = useState<ProposalClassification | null>(null);

  useEffect(() => {
    if (!open || !context) return;
    setCorrection(context.who === 'user' ? context.messageText.slice(0, 2000) : chatCopy.correctionDefault);
    setRationale(context.messageText.slice(0, 2000));
    setTargetKind('standard');
    setPreview(null);
  }, [open, context]);

  useEffect(() => {
    if (!open || !classify || !correction.trim()) {
      setPreview(null);
      return;
    }
    const target = targetForKind(targetKind);
    let cancelled = false;
    void classify({ correction: correction.trim(), target }).then((c) => {
      if (!cancelled) setPreview(c);
    });
    return () => {
      cancelled = true;
    };
  }, [open, classify, correction, targetKind]);

  const target = targetForKind(targetKind);

  return (
    <Modal open={open} title="Propose from correction" onClose={() => { if (!busy) onClose(); }}>
      {context ? (
        <div className="proposeModal">
          <p className="muted">{chatCopy.proposeFromCorrectionHint}</p>
          <label className="proposeModal__field">
            <span>Future behavior</span>
            <textarea rows={3} value={correction} onChange={(e) => setCorrection(e.target.value)} disabled={busy} />
          </label>
          <label className="proposeModal__field">
            <span>Evidence / context</span>
            <textarea rows={2} value={rationale} onChange={(e) => setRationale(e.target.value)} disabled={busy} />
          </label>
          <label className="proposeModal__field">
            <span>Target</span>
            <select value={targetKind} onChange={(e) => setTargetKind(e.target.value as ProposalCanonImpact | 'task')} disabled={busy}>
              {TARGET_OPTIONS.map((o) => (
                <option key={o.kind} value={o.kind}>{o.label}</option>
              ))}
            </select>
          </label>
          {preview ? (
            <div className="proposeModal__preview panel">
              <div className="eyebrow">classification preview</div>
              <div><strong>{preview.route}</strong> · gate {preview.required_gate} · risk {preview.risk}</div>
              <p className="muted">{preview.reason}</p>
            </div>
          ) : null}
          <div className="proposeModal__actions">
            <button type="button" className="btn btn--ghost-d" disabled={busy} onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn btn--solid-d"
              disabled={busy || !correction.trim()}
              onClick={() => onSubmit({ correction: correction.trim(), target, rationale: rationale.trim() || correction.trim() })}
            >
              Create proposal
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

function targetForKind(kind: ProposalCanonImpact | 'task'): ProposalTarget {
  if (kind === 'task') return { kind: 'none' };
  return { kind, action: 'update' };
}
