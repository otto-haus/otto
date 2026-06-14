import React from 'react';
import { chatCopy } from '../../copy/surfaces';

export const MessageActions: React.FC<{
  disabled?: boolean;
  onPropose?: () => void;
  onCorrectThis?: () => void;
}> = ({ disabled = false, onPropose, onCorrectThis }) => {
  if (!onPropose && !onCorrectThis) return null;
  return (
    <div className="msgActions">
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
