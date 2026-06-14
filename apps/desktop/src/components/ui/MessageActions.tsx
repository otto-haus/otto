import React from 'react';
import { chatCopy } from '../../copy/surfaces';

export const MessageActions: React.FC<{
  disabled?: boolean;
  onCorrectThis?: () => void;
}> = ({ disabled = false, onCorrectThis }) => (
  onCorrectThis ? (
    <div className="msgActions">
      <button
        type="button"
        className="msgActions__btn"
        disabled={disabled}
        title={chatCopy.correctThisHint}
        onClick={onCorrectThis}
      >
        {chatCopy.correctThis}
      </button>
    </div>
  ) : null
);
