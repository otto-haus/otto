import React from 'react';
import { Icon } from '../icons';

export const EmptyState: React.FC<{
  eyebrow: string;
  title: string;
  body: string;
  path?: string;
  next?: string;
  variant?: 'default' | 'chat';
}> = ({ eyebrow, title, body, path, next, variant = 'default' }) => (
  <div className={`emptySurface${variant === 'chat' ? ' emptySurface--chat' : ''}`}>
    <div className="eyebrow">{eyebrow}</div>
    <h2>{title}</h2>
    <p>{body}</p>
    {path ? <span className="filechip">{Icon.file} {path}</span> : null}
    {next ? (
      <div className="notice">
        <span className="dot dot--idle" /> {next}
      </div>
    ) : null}
  </div>
);

export const InlineEmpty: React.FC<{ title: string; body?: string }> = ({ title, body }) => (
  <div className="listEmpty">
    <div className="h-sec">{title}</div>
    {body ? <p className="muted">{body}</p> : null}
  </div>
);
