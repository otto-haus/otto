import React, { useState } from 'react';
import { Icon } from '../icons';
import { threadCopy } from '../../copy/surfaces';

export type ThreadSummary = {
  id: string;
  conversationId: string | null;
  title: string;
  updatedAt: number;
  sortOrder?: number | null;
  pinned?: boolean;
};

/** Keep sidebar labels human — hide smoke IDs and raw local keys. */
export function displayThreadTitle(title: string): string {
  const t = title.trim();
  if (!t || /^new chat$/i.test(t)) return 'New chat';
  if (/^local_/i.test(t)) return 'New chat';
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
  editing: boolean;
  confirmingArchive: boolean;
  onSelect?: (thread: ThreadSummary) => void;
  onPin?: (thread: ThreadSummary, pinned: boolean) => void;
  onArchive?: (thread: ThreadSummary) => void;
  onStartRename: (thread: ThreadSummary) => void;
  onCommitRename: (thread: ThreadSummary, title: string) => void;
  onCancelRename: () => void;
  onRequestArchive: (thread: ThreadSummary) => void;
  onMove?: (thread: ThreadSummary, target: ThreadSummary) => void;
  draggingId: string | null;
  onDragThreadStart: (threadId: string) => void;
  onDragThreadEnd: () => void;
}> = ({
  thread,
  active,
  variant,
  editing,
  confirmingArchive,
  onSelect,
  onPin,
  onArchive,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRequestArchive,
  onMove,
  draggingId,
  onDragThreadStart,
  onDragThreadEnd,
}) => {
  const [draft, setDraft] = useState(thread.title);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const skipNextBlurCommit = React.useRef(false);

  React.useEffect(() => {
    if (editing) setDraft(displayThreadTitle(thread.title));
  }, [editing, thread.title]);

  React.useEffect(() => {
    if (!editing) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editing]);

  const commit = () => {
    if (skipNextBlurCommit.current) {
      skipNextBlurCommit.current = false;
      return;
    }
    onCommitRename(thread, draft);
  };

  return (
    <div
      className={`sidebarConvWrap${active ? ' is-active' : ''}${thread.pinned ? ' is-pinned' : ''}${editing ? ' is-editing' : ''}${draggingId === thread.id ? ' is-dragging' : ''}${confirmingArchive ? ' is-confirmingArchive' : ''}`}
      draggable={!!onMove && !editing}
      onDragStart={(event) => {
        if (!onMove || editing) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', thread.id);
        onDragThreadStart(thread.id);
      }}
      onDragOver={(event) => {
        if (!onMove || !draggingId || draggingId === thread.id) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        if (!onMove || !draggingId || draggingId === thread.id) return;
        event.preventDefault();
        onMove({ ...thread, id: draggingId }, thread);
        onDragThreadEnd();
      }}
      onDragEnd={onDragThreadEnd}
    >
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
    {editing ? (
      <div className="sidebarConv thread sidebarConv--editing">
        {variant === 'recent' ? <span className="sidebarConv__icon">{Icon.clock}</span> : null}
        <input
          ref={inputRef}
          className="sidebarConv__rename"
          value={draft}
          aria-label={threadCopy.rename}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              skipNextBlurCommit.current = true;
              onCancelRename();
            }
          }}
        />
      </div>
    ) : (
      <button
        type="button"
        className={`sidebarConv thread${active ? ' is-active' : ''}`}
        onClick={() => onSelect?.(thread)}
        onDoubleClick={(event) => {
          event.preventDefault();
          onStartRename(thread);
        }}
        disabled={!onSelect}
        aria-current={active ? 'true' : undefined}
      >
        {variant === 'recent' ? <span className="sidebarConv__icon">{Icon.clock}</span> : null}
        <span className="sidebarConv__label">{displayThreadTitle(thread.title)}</span>
      </button>
    )}
    {onArchive ? (
      <button
        type="button"
        className={`sidebarConv__archive${confirmingArchive ? ' is-confirming' : ''}`}
        aria-label={confirmingArchive ? threadCopy.archiveConfirm : threadCopy.archive}
        title={confirmingArchive ? threadCopy.archiveConfirm : threadCopy.archive}
        onClick={(event) => {
          event.stopPropagation();
          if (confirmingArchive) onArchive(thread);
          else onRequestArchive(thread);
        }}
      >
        {Icon.archive}
      </button>
    ) : null}
    </div>
  );
};

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
  onRename?: (thread: ThreadSummary, title: string) => void;
  onMove?: (thread: ThreadSummary, target: ThreadSummary) => void;
}> = ({ threads, activeThreadId, activeConversationId, onSelect, onPin, onArchive, onRename, onMove }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingArchiveId, setConfirmingArchiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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
  const startRename = (thread: ThreadSummary) => {
    setConfirmingArchiveId(null);
    setEditingId(thread.id);
  };
  const commitRename = (thread: ThreadSummary, title: string) => {
    setEditingId(null);
    const trimmed = title.trim();
    if (!trimmed || displayThreadTitle(thread.title) === trimmed) return;
    onRename?.(thread, trimmed);
  };
  const requestArchive = (thread: ThreadSummary) => {
    setEditingId(null);
    setConfirmingArchiveId((current) => (current === thread.id ? null : thread.id));
  };
  const moveThread = (dragged: ThreadSummary, target: ThreadSummary) => {
    if (!onMove || dragged.id === target.id) return;
    setConfirmingArchiveId(null);
    onMove(dragged, target);
  };

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
              editing={editingId === thread.id}
              confirmingArchive={confirmingArchiveId === thread.id}
              onSelect={onSelect}
              onPin={onPin}
              onArchive={onArchive}
              onStartRename={startRename}
              onCommitRename={commitRename}
              onCancelRename={() => setEditingId(null)}
              onRequestArchive={requestArchive}
              onMove={onMove ? moveThread : undefined}
              draggingId={draggingId}
              onDragThreadStart={setDraggingId}
              onDragThreadEnd={() => setDraggingId(null)}
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
              editing={editingId === thread.id}
              confirmingArchive={confirmingArchiveId === thread.id}
              onSelect={onSelect}
              onPin={onPin}
              onArchive={onArchive}
              onStartRename={startRename}
              onCommitRename={commitRename}
              onCancelRename={() => setEditingId(null)}
              onRequestArchive={requestArchive}
              onMove={onMove ? moveThread : undefined}
              draggingId={draggingId}
              onDragThreadStart={setDraggingId}
              onDragThreadEnd={() => setDraggingId(null)}
            />
          ))}
        </Section>
      ) : null}
    </div>
  );
};
