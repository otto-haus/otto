import React, { useEffect, useRef, useState } from 'react';
import type { ConstitutionResult, ProposalClassification, ProposalTarget } from '@otto-haus/core';
import { Modal } from '../components/ui/Modal';
import { chatCopy } from '../copy/surfaces';

// Single-field modal: the user only writes the future behavior. The corrected
// response is attached as evidence behind the scenes (see Chat.submitProposal),
// and the proposal target defaults to a canon Standard so the change stays
// human-ratification-gated — nothing applies until the user approves in Curation.
const DEFAULT_TARGET: ProposalTarget = { kind: 'standard', action: 'update' };

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
}> = ({ open, context, busy = false, onClose, onSubmit }) => {
  const [correction, setCorrection] = useState('');
  const [rationale, setRationale] = useState('');
  const correctionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || !context) return;
    setCorrection(context.who === 'user' ? context.messageText.slice(0, 2000) : chatCopy.correctionDefault);
    setRationale(context.messageText.slice(0, 2000));
  }, [open, context]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => correctionRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, context]);

  const submitDisabled = busy || !correction.trim();

  return (
    <Modal open={open} title={chatCopy.correctThisModalTitle} onClose={() => { if (!busy) onClose(); }}>
      {context ? (
        <div className="proposeModal">
          <p className="muted proposeModal__lede">{chatCopy.proposeFromCorrectionHint}</p>

          <label className="proposeModal__field proposeModal__field--hero">
            <span>{chatCopy.futureBehavior}</span>
            <textarea
              ref={correctionRef}
              rows={5}
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              disabled={busy}
              placeholder={chatCopy.correctionDefault}
            />
          </label>

          <div className="proposeModal__actions">
            <button type="button" className="btn btn--ghost-d" disabled={busy} onClick={onClose}>{chatCopy.cancel}</button>
            <button
              type="button"
              className="btn btn--solid-d"
              disabled={submitDisabled}
              onClick={() => onSubmit({
                correction: correction.trim(),
                target: DEFAULT_TARGET,
                rationale: rationale.trim() || correction.trim(),
              })}
            >
              {chatCopy.createProposal}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
