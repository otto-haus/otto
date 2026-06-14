import React, { useState } from 'react';
import { Icon } from '../icons';
import { threadCopy } from '../../copy/surfaces';

export type ThreadSummary = {
  id: string;
  conversationId: string | null;
  title: string;
  updatedAt: number;
  pinned?: boolean;
};

/** Keep sidebar labels human — hide smoke IDs and raw local keys. */
export function displayThreadTitle(title: string): string {
  const t = title.trim();
  if (!t || /^new chat$/i.test(t)) return 'New chat';
  if (/^local[-_]/i.test(t)) return 'New chat';
  if (/^\d{3}-/.test(t) && /thread/i.test(t)) return 'Chat session';
  if (t.length > 42) return `${t.slice(0, 39)}…`;
  return t;
}

function readSectionOpen(key: string, fallback: boolean): boolean {
  try {
    const v = sessionStorage.getItem(key);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeSectionOpen(key: string, open: boolean) {
  try {
    sessionStorage.setItem(key, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

const ConversationRow: React.FC<{
  thread: ThreadSummary;
  active: boolean;
  variant: 'pinned' | 'recent';
  onSelect?: (thread: ThreadSummary) => void;
  onPin?: (thread: ThreadSummary, pinned: boolean) => void;
  onArchive?: (thread: ThreadSummary) => void;
}> = ({ thread, active, variant, onSelect, onPin, onArchive }) => (
  <div className={`sidebarConvWrap${active ? ' is-active' : ''}${thread.pinned ? ' is-pinned' : ''}`}>
    <button
      type="button"
      className={`sidebarConv thread${active ? ' is-active' : ''}`}
      onClick={() => onSelect?.(thread)}
      disabled={!onSelect}
      aria-current={active ? 'true' : undefined}
    >
      <span className="sidebarConv__icon">{variant === 'pinned' ? Icon.pin : Icon.clock}</span>
      <span className="sidebarConv__label">{displayThreadTitle(thread.title)}</span>
    </button>
    {onPin ? (
      <button
        type="button"
        className={`sidebarConv__pin${thread.pinned ? ' is-on' : ''}`}
        aria-label={thread.pinned ? threadCopy.unpin : threadCopy.pin}
        title={thread.pinned ? threadCopy.unpin : threadCopy.pin}
        onClick={(event) => {
          event.stopPropagation();
          onPin(thread, !thread.pinned);
        }}
      >
        {Icon.pin}
      </button>
    ) : null}
    {onArchive ? (
      <button
        type="button"
        className="sidebarConv__archive"
        aria-label={threadCopy.archive}
        title={threadCopy.archive}
        onClick={(event) => {
          event.stopPropagation();
          onArchive(thread);
        }}
      >
        {Icon.archive}
      </button>
    ) : null}
  </div>
);

const Section: React.FC<{
  label: string;
  storageKey: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}> = ({ label, storageKey, defaultOpen, children }) => {
  const [open, setOpen] = useState(() => readSectionOpen(storageKey, defaultOpen));
  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      writeSectionOpen(storageKey, next);
      return next;
    });
  };
  return (
    <div className="sidebarSection">
      <button type="button" className="sidebarSection__head" onClick={toggle} aria-expanded={open}>
        <span className={`sidebarSection__chev${open ? ' is-open' : ''}`}>{Icon.chevronRight}</span>
        <span>{label}</span>
      </button>
      {open ? <div className="sidebarSection__body">{children}</div> : null}
    </div>
  );
};

export const ThreadList: React.FC<{
  threads: ThreadSummary[];
  activeThreadId?: string | null;
  activeConversationId?: string | null;
  onSelect?: (thread: ThreadSummary) => void;
  onPin?: (thread: ThreadSummary, pinned: boolean) => void;
  onArchive?: (thread: ThreadSummary) => void;
}> = ({ threads, activeThreadId, activeConversationId, onSelect, onPin, onArchive }) => {
  const pinned = threads.filter((t) => t.pinned);
  const recents = threads.filter((t) => !t.pinned);

  if (!threads.length) {
    return (
      <div className="sidebar__conversations sidebar__threads">
        <p className="sidebarSection__empty threadGroup__empty">{threadCopy.empty}</p>
      </div>
    );
  }

  const isActive = (thread: ThreadSummary) =>
    activeThreadId
      ? thread.id === activeThreadId
      : !!activeConversationId && thread.conversationId === activeConversationId;

  return (
    <div className="sidebar__conversations sidebar__threads" aria-label="Conversations">
      <Section label={threadCopy.pinnedLabel} storageKey="otto.sidebar.pinned" defaultOpen>
        {pinned.length > 0 ? (
          pinned.map((thread) => (
            <ConversationRow
              key={thread.id}
              thread={thread}
              active={isActive(thread)}
              variant="pinned"
              onSelect={onSelect}
              onPin={onPin}
              onArchive={onArchive}
            />
          ))
        ) : (
          <p className="sidebarSection__empty">{threadCopy.pinnedEmpty}</p>
        )}
      </Section>
      {recents.length > 0 ? (
        <Section label={threadCopy.recentsLabel} storageKey="otto.sidebar.recents" defaultOpen>
          {recents.map((thread) => (
            <ConversationRow
              key={thread.id}
              thread={thread}
              active={isActive(thread)}
              variant="recent"
              onSelect={onSelect}
              onPin={onPin}
              onArchive={onArchive}
            />
          ))}
        </Section>
      ) : null}
    </div>
  );
};
