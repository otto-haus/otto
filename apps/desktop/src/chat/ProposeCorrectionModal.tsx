import React, { useEffect, useState } from 'react';
import type { ConstitutionResult, ProposalCanonImpact, ProposalClassification, ProposalTarget } from '@otto-haus/core';
import { Modal } from '../components/ui/Modal';
import { chatCopy, cultureSettingsCopy, memoryWritebackCopy } from '../copy/surfaces';

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
  constitutionGet?: () => Promise<ConstitutionResult>;
}> = ({ open, context, busy = false, onClose, onSubmit, classify, constitutionGet }) => {
  const [correction, setCorrection] = useState('');
  const [rationale, setRationale] = useState('');
  const [targetKind, setTargetKind] = useState<ProposalCanonImpact | 'task'>('standard');
  const [preview, setPreview] = useState<ProposalClassification | null>(null);
  const [writebackAllowed, setWritebackAllowed] = useState(true);
  const [writebackReason, setWritebackReason] = useState<string>(cultureSettingsCopy.writebackGate);

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

  useEffect(() => {
    if (!open || targetKind !== 'memory' || !constitutionGet) {
      setWritebackAllowed(true);
      setWritebackReason(cultureSettingsCopy.writebackGate);
      return;
    }
    let cancelled = false;
    void constitutionGet().then((result) => {
      if (cancelled) return;
      const policy = result.document.writeback_policy;
      const allowed = policy.mode === 'proposal_only'
        && policy.requires_curation_accept
        && policy.silent_apply_forbidden;
      setWritebackAllowed(allowed);
      setWritebackReason(allowed
        ? cultureSettingsCopy.writebackGate
        : 'Constitution writeback_policy requires proposal-only flow with Curation accept.');
    }).catch(() => {
      if (!cancelled) {
        setWritebackAllowed(false);
        setWritebackReason('Constitution unavailable — memory writeback blocked until policy loads.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, targetKind, constitutionGet]);

  const target = targetForKind(targetKind);
  const memoryTarget = targetKind === 'memory';
  const submitDisabled = busy || !correction.trim() || (memoryTarget && !writebackAllowed);

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
          {memoryTarget ? (
            <div className="proposeModal__writebackGate panel">
              <div className="eyebrow">{memoryWritebackCopy.eyebrow}</div>
              <p className="muted" style={{ marginTop: 8 }}>{memoryWritebackCopy.lede}</p>
              <p className="faint" style={{ marginTop: 8 }}>{writebackReason}</p>
              {context ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  <strong>Evidence:</strong> {context.messageText.slice(0, 280)}
                  {context.messageText.length > 280 ? '…' : ''}
                </p>
              ) : null}
              {!writebackAllowed ? (
                <p className="notice notice--warn" style={{ marginTop: 10 }}>{writebackReason}</p>
              ) : null}
            </div>
          ) : null}
          <div className="proposeModal__actions">
            <button type="button" className="btn btn--ghost-d" disabled={busy} onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn btn--solid-d"
              disabled={submitDisabled}
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
