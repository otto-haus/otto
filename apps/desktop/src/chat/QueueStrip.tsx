import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/icons';
import { chatCopy } from '../copy/surfaces';
import {
  previewQueueText,
  queueThreadCounts,
  sortQueueDisplayItems,
  splitQueueText,
  type QueueDisplayItem,
} from './queue-storage';

const FAILED_VISIBLE_CAP = 3;

export type QueueStripProps = {
  queue: QueueDisplayItem[];
  recalledQueueId: string | null;
  onClear: () => void;
  onRetryAll: () => void;
  onRetryOne: (id: string) => void;
  onRemove: (id: string) => void;
  onRecall: (id: string) => void;
  onSendNow: (id: string) => void;
};

export const QueueStrip: React.FC<QueueStripProps> = ({
  queue,
  recalledQueueId,
  onClear,
  onRetryAll,
  onRetryOne,
  onRemove,
  onRecall,
  onSendNow,
}) => {
  const sorted = useMemo(() => sortQueueDisplayItems(queue), [queue]);
  const { pending, failed, hasNext } = queueThreadCounts(sorted);
  const nextItem = sorted.find((item) => item.isNext);
  const [expanded, setExpanded] = useState(failed > 0 || queue.length <= 2);
  const [showAllFailed, setShowAllFailed] = useState(false);
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  useEffect(() => {
    if (failed > 0) setExpanded(true);
  }, [failed]);

  useEffect(() => {
    if (failed <= FAILED_VISIBLE_CAP) setShowAllFailed(false);
  }, [failed]);

  const failedItems = sorted.filter((item) => item.state === 'failed');
  const pendingItems = sorted.filter((item) => item.state !== 'failed');
  const hiddenFailed = failed > FAILED_VISIBLE_CAP && !showAllFailed
    ? failedItems.length - FAILED_VISIBLE_CAP
    : 0;
  const visibleFailed = hiddenFailed ? failedItems.slice(0, FAILED_VISIBLE_CAP) : failedItems;
  const visibleItems = [...visibleFailed, ...pendingItems];

  const headSummary = nextItem && !failed
    ? chatCopy.queueNextPreview(previewQueueText(nextItem.text))
    : failed && !pending
      ? chatCopy.queueFailedOnlySummary(failed)
      : null;

  return (
    <div
      className={`queuebar${failed ? ' queuebar--warn' : ''}${expanded ? ' queuebar--expanded' : ' queuebar--compact'}`}
      aria-label="Unsent messages"
    >
      <div className="queuebar__head">
        <button
          type="button"
          className="queuebar__headToggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((x) => !x)}
        >
          <div className="queuebar__meta">
            <span className="queuebar__eyebrow">{chatCopy.queueEyebrow}</span>
            <div className="queuebar__pills">
              {hasNext && (
                <span className="queuebar__pill queuebar__pill--next">{chatCopy.queuePillNext}</span>
              )}
              {pending > 0 && (
                <span className="queuebar__pill">{chatCopy.queuePillWaitCount(pending)}</span>
              )}
              {failed > 0 && (
                <span className="queuebar__pill queuebar__pill--failed">{chatCopy.queuePillFailCount(failed)}</span>
              )}
            </div>
            {headSummary ? <span className="queuebar__summary">{headSummary}</span> : null}
          </div>
        </button>
        <div className="queuebar__actions">
          {failed > 0 && (
            <button type="button" className="queuebar__action queuebar__action--stop" onClick={onRetryAll}>
              {chatCopy.queueRetryAll}
            </button>
          )}
          {queue.length > 1 && (
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
          {visibleItems.map((item) => {
            const inspected = inspectedId === item.id;
            const recalled = recalledQueueId === item.id;
            const isFailed = item.state === 'failed';
            const { body, attachmentLines } = splitQueueText(item.text);
            return (
              <div
                className={`queueitem${inspected ? ' queueitem--inspected' : ''}${recalled ? ' queueitem--recalled' : ''}${isFailed ? ' queueitem--failed' : ''}`}
                key={item.id}
              >
                <div className="queueitem__row">
                  <span className={`queueitem__pill queueitem__pill--${item.isNext ? 'next' : item.state}`}>
                    {item.state === 'failed'
                      ? chatCopy.queuePillFailed
                      : item.isNext
                        ? chatCopy.queuePillNext
                        : item.sendPosition
                          ? chatCopy.queuePillPosition(item.sendPosition)
                          : chatCopy.queuePillWaiting}
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
                      onClick={() => setInspectedId((current) => (current === item.id ? null : item.id))}
                    >
                      {inspected ? chatCopy.queueHideFull : chatCopy.queueViewFull}
                    </button>
                    <button type="button" className="queueitem__action" onClick={() => onRecall(item.id)}>
                      {chatCopy.queueEdit}
                    </button>
                    {isFailed ? (
                      <button type="button" className="queueitem__action queueitem__action--primary" onClick={() => onRetryOne(item.id)}>
                        {chatCopy.queueRetryOne}
                      </button>
                    ) : item.state === 'queued' && !item.isNext ? (
                      <button type="button" className="queueitem__action queueitem__action--primary" onClick={() => onSendNow(item.id)}>
                        {chatCopy.queueSendNow}
                      </button>
                    ) : null}
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
                {(inspected || isFailed) && (
                  <div className="queueitem__detail" aria-live="polite">
                    {isFailed && item.error ? (
                      <div className="queueitem__error">{item.error}</div>
                    ) : null}
                    {body ? <div className="queueitem__body">{body}</div> : null}
                    {attachmentLines.length > 0 && (
                      <ul className="queueitem__attachments">
                        {attachmentLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {hiddenFailed > 0 && (
            <button type="button" className="queuebar__moreFailed" onClick={() => setShowAllFailed(true)}>
              {chatCopy.queueMoreFailed(hiddenFailed)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
