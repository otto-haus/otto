import React from 'react';
import { Icon } from '../icons';
import { threadCopy } from '../../copy/surfaces';

export type ThreadSummary = {
  id: string;
  conversationId: string | null;
  title: string;
  updatedAt: number;
};

export const ThreadList: React.FC<{
  threads: ThreadSummary[];
  activeThreadId?: string | null;
  activeConversationId?: string | null;
  onSelect?: (thread: ThreadSummary) => void;
}> = ({ threads, activeThreadId, activeConversationId, onSelect }) => {
  if (!threads.length) {
    return (
      <div className="sidebar__threads">
        <p className="threadGroup__label threadGroup__empty">{threadCopy.empty}</p>
      </div>
    );
  }

  return (
    <div className="sidebar__threads" aria-label="Recent chats">
      <div className="threadGroup">
        <div className="threadGroup__label">{threadCopy.groupLabel}</div>
        {threads.map((thread) => {
          const active = activeThreadId
            ? thread.id === activeThreadId
            : !!activeConversationId && thread.conversationId === activeConversationId;
          return (
            <button
              key={thread.id}
              type="button"
              className={`thread${active ? ' is-active' : ''}`}
              onClick={() => onSelect?.(thread)}
              disabled={!onSelect}
              aria-current={active ? 'true' : undefined}
            >
              <span className="thread__icon">{Icon.chat}</span>
              <span className="thread__label">{thread.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
