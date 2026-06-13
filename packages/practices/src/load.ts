import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import type { ApprovalRequirement, PracticeSpec } from '@otto-haus/core';

const APPROVAL_ALIASES: Record<string, ApprovalRequirement> = {
  'enabling-globally': 'enabling-globally',
  'enabling globally': 'enabling-globally',
  'external-side-effects': 'external-side-effects',
  'external side effects': 'external-side-effects',
  'permission-expansion': 'permission-expansion',
  'permission expansion': 'permission-expansion',
  'send-or-publish': 'send-or-publish',
  'send or publish': 'send-or-publish',
  spend: 'spend',
  deploy: 'deploy',
  'delete-or-destroy': 'delete-or-destroy',
  'delete or destroy': 'delete-or-destroy',
  'credential-or-security-change': 'credential-or-security-change',
  'credential or security change': 'credential-or-security-change',
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, ' ');
}

export function normalizeApprovalRequirement(value: unknown): ApprovalRequirement | string {
  if (typeof value !== 'string') {
    return String(value);
  }

  const normalized = normalizeText(value);
  const kebab = normalized.replace(/\s+/g, '-');

  if (APPROVAL_ALIASES[normalized]) {
    return APPROVAL_ALIASES[normalized];
  }

  if (APPROVAL_ALIASES[kebab]) {
    return APPROVAL_ALIASES[kebab];
  }

  if (/\b(send|post|publish|outbound)\b/.test(normalized)) {
    return 'send-or-publish';
  }

  return kebab;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function loadPracticeSpec(filePath: string): Promise<PracticeSpec> {
  const source = await readFile(filePath, 'utf8');
  const parsed = parse(source) as unknown;

  if (!isRecord(parsed)) {
    throw new Error(`Practice spec must be a YAML object: ${filePath}`);
  }

  const approvalRequiredFor = Array.isArray(parsed.approval_required_for)
    ? parsed.approval_required_for.map(normalizeApprovalRequirement)
    : parsed.approval_required_for;

  return {
    ...parsed,
    version: String(parsed.version),
    approval_required_for: approvalRequiredFor,
  } as PracticeSpec;
}
