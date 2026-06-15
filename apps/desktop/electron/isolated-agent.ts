/** ADR 093 isolation boundary reasons — required when creating a second agent (#120). */
export const ISOLATION_BOUNDARY_REASONS = [
  { id: 'different_owner', label: 'Different human owner' },
  { id: 'different_authority', label: 'Different authority level' },
  { id: 'different_secrets_tools', label: 'Different secrets or tools' },
  { id: 'different_schedule_channel', label: 'Different schedule or channel' },
  { id: 'different_mission', label: 'Different long-running mission' },
  { id: 'strong_isolation', label: 'Strong isolation need' },
] as const;

export type IsolationBoundaryReason = (typeof ISOLATION_BOUNDARY_REASONS)[number]['id'];

export function isIsolationBoundaryReason(value: string): value is IsolationBoundaryReason {
  return ISOLATION_BOUNDARY_REASONS.some((row) => row.id === value);
}

export function isolationBoundaryLabel(reason: IsolationBoundaryReason): string {
  return ISOLATION_BOUNDARY_REASONS.find((row) => row.id === reason)?.label ?? reason;
}
