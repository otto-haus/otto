import React from 'react';
import { memoryWritebackCopy } from '../../copy/surfaces';
import { Modal } from './Modal';

export const MemoryWritebackGate: React.FC<{
  open: boolean;
  targetLabel: string;
  summary: string;
  onApprove: () => void;
  onDeny: () => void;
  onClose: () => void;
}> = ({ open, targetLabel, summary, onApprove, onDeny, onClose }) => (
  <Modal open={open} onClose={onClose} title={memoryWritebackCopy.title}>
    <div className="eyebrow">{memoryWritebackCopy.eyebrow}</div>
    <p className="lede" style={{ marginTop: 8 }}>{memoryWritebackCopy.lede}</p>
    <div className="panel" style={{ marginTop: 12 }}>
      <div className="eyebrow">{memoryWritebackCopy.targetEyebrow}</div>
      <div className="card__title" style={{ marginTop: 6 }}>{targetLabel}</div>
      <p className="muted" style={{ marginTop: 8 }}>{summary}</p>
    </div>
    <div className="row" style={{ marginTop: 16, gap: 8 }}>
      <button type="button" className="btn btn--primary" onClick={onApprove}>{memoryWritebackCopy.approve}</button>
      <button type="button" className="btn btn--ghost" onClick={onDeny}>{memoryWritebackCopy.deny}</button>
    </div>
  </Modal>
);
