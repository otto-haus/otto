import React from 'react';
import type { StatusCode } from '../../../electron/shared/types';
import type { ReadyStatus } from '../../readiness';

const toneClass = (s: string): string => {
  if (s === 'active' || s === 'success' || s === 'complete' || s === 'applied' || s === 'ready' || s === 'connected' || s === 'configured')
    return 'pill--ok';
  if (
    s === 'blocked' ||
    s === 'pending' ||
    s === 'needs_approval' ||
    s === 'no-api-key' ||
    s === 'no-agent' ||
    s === 'unreachable' ||
    s === 'sdk-missing' ||
    s === 'stale' ||
    s === 'error' ||
    s === 'missing'
  )
    return 'pill--warn';
  if (s === 'failed' || s === 'rejected') return 'pill--stop';
  if (s === 'proposed' || s === 'running' || s === 'draft' || s === 'deferred') return 'pill--info';
  return '';
};

/** Runtime connection diagnosis pills (058 — single map for Settings + ConnectLetta). */
export const STATUS_CODE_LABELS: Record<StatusCode, string> = {
  ready: 'connected',
  'no-api-key': 'auth needed',
  'no-agent': 'needs agent',
  unreachable: 'unreachable',
  'sdk-missing': 'SDK missing',
  stale: 'stale session',
  error: 'not connected',
};

/** Readiness panel row pills (058 — collapsed from Panes readyPill). */
export const READY_STATUS_LABELS: Record<ReadyStatus, string> = {
  connected: 'connected',
  configured: 'configured',
  file: 'file-backed',
  missing: 'missing',
  'not-wired': 'not wired',
};

export const StatusPill: React.FC<{ status: string; label?: string }> = ({ status, label }) => (
  <span className={`pill ${toneClass(status)}`}>{label ?? status}</span>
);

export const statusPill = (s: string) => <StatusPill status={s} />;

export const statusCodePill = (code: StatusCode) => (
  <StatusPill status={code} label={STATUS_CODE_LABELS[code]} />
);

export const readyStatusPill = (status: ReadyStatus) => (
  <StatusPill status={status} label={READY_STATUS_LABELS[status]} />
);
