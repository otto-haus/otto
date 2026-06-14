import React from 'react';
import { Icon } from '../icons';

const toneClass = (s: string): string => {
  if (s === 'active' || s === 'success' || s === 'complete' || s === 'applied') return 'pill--ok';
  if (s === 'blocked' || s === 'pending' || s === 'needs_approval') return 'pill--warn';
  if (s === 'failed' || s === 'rejected') return 'pill--stop';
  if (s === 'proposed' || s === 'running' || s === 'draft' || s === 'deferred') return 'pill--info';
  return '';
};

export const StatusPill: React.FC<{ status: string; label?: string }> = ({ status, label }) => (
  <span className={`pill ${toneClass(status)}`}>{label ?? status}</span>
);

export const statusPill = (s: string) => <StatusPill status={s} />;
