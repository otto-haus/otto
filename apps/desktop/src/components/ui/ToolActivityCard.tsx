import React, { useState } from 'react';
import { chatCopy } from '../../copy/surfaces';
import {
  formatDurationMs,
  formatMessageTime,
  formatToolSummary,
  type ToolActivity,
} from '../../chat/tool-activity';

async function copyText(text: string): Promise<boolean> {
  if (!text.trim()) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const ToolActivityCard: React.FC<{
  activity: ToolActivity;
  timestamp?: string;
  onCopied?: () => void;
}> = ({ activity, timestamp, onCopied }) => {
  const [expanded, setExpanded] = useState(false);
  const summary = formatToolSummary(activity.toolName, activity.toolInput, activity.status);
  const duration = activity.durationMs != null ? formatDurationMs(activity.durationMs) : '';
  const hasDetails = Boolean(activity.output?.trim() || Object.keys(activity.toolInput ?? {}).length);
  const statusLabel = activity.status === 'running'
    ? chatCopy.toolRunning
    : activity.status === 'error'
      ? chatCopy.toolFailed
      : chatCopy.toolDone;

  return (
    <article
      className={`toolcard toolcard--${activity.status}${expanded ? ' toolcard--expanded' : ''}`}
      aria-live={activity.status === 'running' ? 'polite' : undefined}
    >
      <div className="toolcard__top">
        <span className={`toolcard__status toolcard__status--${activity.status}`} aria-hidden="true" />
        <div className="toolcard__summary">
          <span className="toolcard__title">{summary}</span>
          <span className="toolcard__meta">
            <span className="srOnly">{statusLabel}</span>
            {duration ? <span className="toolcard__duration">{duration}</span> : null}
            {timestamp ? <time className="toolcard__time" dateTime={timestamp}>{formatMessageTime(timestamp)}</time> : null}
          </span>
        </div>
        <div className="toolcard__actions">
          {activity.output?.trim() ? (
            <button
              type="button"
              className="toolcard__btn"
              aria-label={chatCopy.copyOutput}
              onClick={() => {
                void copyText(activity.output ?? '').then((ok) => {
                  if (ok) onCopied?.();
                });
              }}
            >
              {chatCopy.copy}
            </button>
          ) : null}
          {hasDetails ? (
            <button
              type="button"
              className="toolcard__btn"
              aria-expanded={expanded}
              aria-label={expanded ? chatCopy.hideDetails : chatCopy.showDetails}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? chatCopy.hideDetails : chatCopy.showDetails}
            </button>
          ) : null}
        </div>
      </div>
      {expanded && hasDetails ? (
        <div className="toolcard__details">
          {activity.toolInput && Object.keys(activity.toolInput).length > 0 ? (
            <pre className="toolcard__input mono faint">{JSON.stringify(activity.toolInput, null, 2)}</pre>
          ) : null}
          {activity.output?.trim() ? (
            <pre className={`toolcard__out${activity.status === 'error' ? ' toolcard__out--error' : ''}`}>{activity.output}</pre>
          ) : activity.status === 'running' ? (
            <div className="toolcard__pending">{chatCopy.toolRunningHint}</div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
