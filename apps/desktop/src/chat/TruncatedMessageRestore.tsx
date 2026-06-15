import type React from 'react';
import { useState } from 'react';
import { chatCopy } from '../copy/surfaces';
import { readStoredMessageFullText, type StoredChatMsg } from './message-storage';

type TruncatedMessageRestoreProps = {
  message: StoredChatMsg;
  threadId: string | null;
  expandedText?: string;
  onExpand: (messageId: string, fullText: string) => void;
};

export const TruncatedMessageRestore: React.FC<TruncatedMessageRestoreProps> = ({
  message,
  threadId,
  expandedText,
  onExpand,
}) => {
  const [busy, setBusy] = useState(false);
  if (!message.truncated || expandedText) return null;

  const hiddenChars = Math.max(
    0,
    (message.truncatedFromLength ?? message.text.length) - message.text.length,
  );

  const handleExpand = () => {
    setBusy(true);
    const fullText = readStoredMessageFullText(threadId, message.id, { allowLegacyFallback: true });
    setBusy(false);
    if (fullText) onExpand(message.id, fullText);
  };

  return (
    <p className="msg__truncation">
      {chatCopy.truncatedOnReload(hiddenChars)}
      {' '}
      <button
        type="button"
        className="msg__truncationLink"
        onClick={handleExpand}
        disabled={busy}
      >
        {busy ? chatCopy.truncatedLoading : chatCopy.truncatedShowFull}
      </button>
    </p>
  );
};
