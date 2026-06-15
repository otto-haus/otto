import React from 'react';
import { chatCopy, previewCopy } from '../../copy/surfaces';

export const MessageActions: React.FC<{
  disabled?: boolean;
  onPropose?: () => void;
  onCorrectThis?: () => void;
  onPreview?: () => void;
  onCopy?: () => void;
}> = ({ disabled = false, onPropose, onCorrectThis, onPreview, onCopy }) => {
  if (!onPropose && !onCorrectThis && !onPreview && !onCopy) return null;
  return (
    <div className="msgActions">
      {onCopy ? (
        <button
          type="button"
          className="msgActions__btn"
          disabled={disabled}
          title={chatCopy.copyMessage}
          aria-label={chatCopy.copyMessage}
          onClick={onCopy}
        >
          {chatCopy.copy}
        </button>
      ) : null}
      {onPreview ? (
        <button
          type="button"
          className="msgActions__btn"
          disabled={disabled}
          title={previewCopy.openMessageHint}
          onClick={onPreview}
        >
          {previewCopy.openMessage}
        </button>
      ) : null}
      {onCorrectThis ? (
        <button
          type="button"
          className="msgActions__btn msgActions__btn--primary"
          disabled={disabled}
          title={chatCopy.correctThisHint}
          onClick={onCorrectThis}
        >
          {chatCopy.correctThis}
        </button>
      ) : null}
      {onPropose && !onCorrectThis ? (
        <button
          type="button"
          className="msgActions__btn"
          disabled={disabled}
          title={chatCopy.proposeFromCorrectionHint}
          onClick={onPropose}
        >
          {chatCopy.proposeFromCorrection}
        </button>
      ) : null}
    </div>
  );
};
