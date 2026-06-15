import React, { useState } from 'react';
import { Icon } from '../components/icons';
import { chatCopy } from '../copy/surfaces';
import type { QueueItemDetailView, QueueItemView } from '../runtime';
import { previewQueueText, splitQueueText } from './queue-storage';
import { queueBannerCounts, selectQueueBanner, stateLabel } from './outbox-view';

/**
 * The "N couldn't send" banner, rendered ENTIRELY from the main-process durable outbox snapshot
 * (#754). The renderer holds no durable queue state — `items` is the snapshot from `useOutbox`.
 */
export const OutboxBanner: React.FC<{
  items: QueueItemView[];
  threadId: string | null;
  recalledId: string | null;
  onClear: () => void;
  onRetryAll: () => void;
  onRetryOne: (id: string) => void;
  onRecall: (id: string) => void;
  onRemove: (id: string) => void;
  getDetail: (id: string) => Promise<QueueItemDetailView | null>;
}> = ({ items, threadId, recalledId, onClear, onRetryAll, onRetryOne, onRecall, onRemove, getDetail }) => {
  const banner = selectQueueBanner(items, threadId);
  const counts = queueBannerCounts(banner);
  const [expanded, setExpanded] = useState(banner.length <= 2);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<QueueItemDetailView | null>(null);

  if (banner.length === 0) return null;

  const stuck = counts.failed + counts.blocked + counts.interrupted;
  const summary = stuck && counts.waiting
    ? chatCopy.queueMixed(counts.waiting, stuck)
    : stuck
      ? chatCopy.queueFailed(stuck)
      : chatCopy.queuePending(counts.waiting);
  const nextItem = banner.find((item) => item.isNext);
  const summaryText = nextItem ? chatCopy.queueNextSummary(summary, previewQueueText(nextItem.text)) : summary;
  const retryable = stuck > 0;

  const toggleInspect = async (id: string) => {
    if (inspectedId === id) {
      setInspectedId(null);
      setDetail(null);
      return;
    }
    setInspectedId(id);
    setDetail(await getDetail(id));
  };

  return (
    <div
      className={`queuebar${stuck ? ' queuebar--warn' : ''}${expanded ? ' queuebar--expanded' : ' queuebar--compact'}`}
      aria-label="Unsent messages"
    >
      <div className="queuebar__head">
        <span className={`dot ${stuck ? 'dot--warn' : 'dot--idle'}`} aria-hidden="true" />
        <span className="queuebar__summary">{summaryText}</span>
        <div className="queuebar__actions">
          {retryable && (
            <button type="button" className="queuebar__action queuebar__action--primary" onClick={onRetryAll}>
              {chatCopy.queueRetryAll}
            </button>
          )}
          {banner.length > 2 && (
            <button type="button" className="queuebar__action" onClick={() => setExpanded((x) => !x)}>
              {expanded ? chatCopy.queueHide : chatCopy.queueShow}
            </button>
          )}
          <button type="button" className="queuebar__action" onClick={onClear}>
            {chatCopy.queueClearAll}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="queuebar__items">
          {banner.map((item) => {
            const inspected = inspectedId === item.id;
            const recalled = recalledId === item.id;
            const { body, attachmentLines } = splitQueueText(item.text);
            const retryableRow = item.state === 'failed' || item.state === 'blocked' || item.state === 'interrupted';
            return (
              <div
                className={`queueitem${inspected ? ' queueitem--inspected' : ''}${recalled ? ' queueitem--recalled' : ''}`}
                key={item.id}
              >
                <div className="queueitem__row">
                  <span className={`queueitem__pill queueitem__pill--${item.isNext ? 'next' : item.state}`}>
                    {stateLabel(item)}
                  </span>
                  <button
                    type="button"
                    className="queueitem__text queueitem__text--recall"
                    title={item.text}
                    onClick={() => onRecall(item.id)}
                  >
                    {previewQueueText(item.text)}
                  </button>
                  <div className="queueitem__controls">
                    <button
                      type="button"
                      className="queueitem__action"
                      aria-expanded={inspected}
                      onClick={() => void toggleInspect(item.id)}
                    >
                      {inspected ? chatCopy.queueHideFull : chatCopy.queueViewFull}
                    </button>
                    <button type="button" className="queueitem__action" onClick={() => onRecall(item.id)}>
                      {chatCopy.queueEdit}
                    </button>
                    {retryableRow && (
                      <button
                        type="button"
                        className="queueitem__action queueitem__action--primary"
                        onClick={() => onRetryOne(item.id)}
                      >
                        {chatCopy.queueRetryOne}
                      </button>
                    )}
                    <button
                      type="button"
                      className="queueitem__remove"
                      aria-label={chatCopy.queueRemoveOne}
                      onClick={() => onRemove(item.id)}
                    >
                      {Icon.x}
                    </button>
                  </div>
                </div>
                {inspected && (
                  <div className="queueitem__detail" aria-live="polite">
                    {body ? <div className="queueitem__body">{body}</div> : null}
                    {attachmentLines.length > 0 && (
                      <ul className="queueitem__attachments">
                        {attachmentLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                    <dl className="queueitem__meta">
                      <div>
                        <dt>Attempts</dt>
                        <dd>{item.attemptCount} / {item.maxAttempts}</dd>
                      </div>
                      {item.model ? (
                        <div>
                          <dt>Model</dt>
                          <dd>{item.model}{item.effort ? ` · ${item.effort}` : ''}</dd>
                        </div>
                      ) : null}
                      {item.errorCode ? (
                        <div>
                          <dt>Reason</dt>
                          <dd>{item.errorCode}{item.errorMessage ? ` — ${item.errorMessage}` : ''}</dd>
                        </div>
                      ) : null}
                    </dl>
                    {detail && detail.id === item.id && detail.turnEvents.length > 0 && (
                      <ul className="queueitem__events">
                        {detail.turnEvents.slice(-5).map((event) => (
                          <li key={event.id}>
                            <span className={`queueitem__event queueitem__event--${event.type}`}>{event.type}</span>
                            {' '}{event.title}{event.body ? ` — ${event.body}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
