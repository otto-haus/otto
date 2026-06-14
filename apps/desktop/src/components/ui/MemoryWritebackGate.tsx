import React from 'react';
import { memoryWritebackCopy } from '../../copy/surfaces';
import { Modal } from './Modal';

export type MemoryWritebackGatePanelProps = {
  targetLabel: string;
  summary: string;
  policyNote: string;
  blocked?: boolean;
  evidence?: string;
};

/** Inline gate panel — constitution policy via `constitutionGet` in ProposeCorrectionModal. */
export const MemoryWritebackGatePanel: React.FC<MemoryWritebackGatePanelProps> = ({
  targetLabel,
  summary,
  policyNote,
  blocked = false,
  evidence,
}) => (
  <div className="memoryWritebackGate panel">
    <div className="eyebrow">{memoryWritebackCopy.eyebrow}</div>
    <p className="muted" style={{ marginTop: 8 }}>{memoryWritebackCopy.lede}</p>
    <p className="faint" style={{ marginTop: 8 }}>{policyNote}</p>
    <div className="panel" style={{ marginTop: 12 }}>
      <div className="eyebrow">{memoryWritebackCopy.targetEyebrow}</div>
      <div className="card__title" style={{ marginTop: 6 }}>{targetLabel}</div>
      <p className="muted" style={{ marginTop: 8 }}>{summary}</p>
    </div>
    {evidence ? (
      <p className="muted" style={{ marginTop: 8 }}>
        <strong>Evidence:</strong> {evidence}
      </p>
    ) : null}
    {blocked ? (
      <p className="notice notice--warn" style={{ marginTop: 10 }}>{policyNote}</p>
    ) : null}
  </div>
);

/** Standalone approve/deny modal — reserved for future Letta apply IPC; proposal flow uses panel + Curation. */
export const MemoryWritebackGate: React.FC<{
  open: boolean;
  targetLabel: string;
  summary: string;
  onApprove: () => void;
  onDeny: () => void;
  onClose: () => void;
}> = ({ open, targetLabel, summary, onApprove, onDeny, onClose }) => (
  <Modal open={open} onClose={onClose} title={memoryWritebackCopy.title}>
    <MemoryWritebackGatePanel
      targetLabel={targetLabel}
      summary={summary}
      policyNote={memoryWritebackCopy.lede}
    />
    <div className="row" style={{ marginTop: 16, gap: 8 }}>
      <button type="button" className="btn btn--primary" onClick={onApprove}>{memoryWritebackCopy.approve}</button>
      <button type="button" className="btn btn--ghost" onClick={onDeny}>{memoryWritebackCopy.deny}</button>
    </div>
  </Modal>
);
