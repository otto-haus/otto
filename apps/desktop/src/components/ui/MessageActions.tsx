import React from 'react';
import { chatCopy, previewCopy } from '../../copy/surfaces';

export const MessageActions: React.FC<{
  disabled?: boolean;
  onPropose?: () => void;
  onCorrectThis?: () => void;
  onPreview?: () => void;
}> = ({ disabled = false, onPropose, onCorrectThis, onPreview }) => {
  if (!onPropose && !onCorrectThis && !onPreview) return null;
  return (
    <div className="msgActions">
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
