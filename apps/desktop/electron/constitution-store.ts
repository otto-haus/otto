import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { ConstitutionAmendResult, ConstitutionDocument, ConstitutionResult } from '@otto-haus/core';
import { OTTO_DIR } from './config-store';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';

export const CONSTITUTION_YAML = join(OTTO_DIR, 'constitution.yaml');
export const CONSTITUTION_MD = join(OTTO_DIR, 'constitution.md');

const DEFAULT_CONSTITUTION: ConstitutionDocument = {
  schema: 'otto.constitution.v1',
  version: '0.1',
  values: [
    'Behavior compounds through correction, proposal, and ratification — not silent edits.',
    'The office decides. Otto records the review.',
    'Files are truth; memory is lessons; UI is workspace.',
  ],
  forbidden_actions: [
    'silent canon mutation without Curation accept',
    'direct memory writeback without ratification',
    'auto-ratify from constitution edits',
    'provider secret storage in otto config',
  ],
  approval_rules: [
    'Canon-changing proposals require human ratification.',
    'Memory writeback requires Curation accept before Letta apply.',
    'Consequential autonomy doors require explicit operator approval.',
  ],
  standards_refs: ['quality', 'receipts'],
  writeback_policy: {
    mode: 'proposal_only',
    requires_curation_accept: true,
    silent_apply_forbidden: true,
  },
  ratification_requirements: [
    'Accepted proposals emit a receipt and Behavior updated moment.',
    'Rejected or deferred proposals leave canon unchanged.',
  ],
};

export type ConstitutionValidation =
  | { ok: true; document: ConstitutionDocument }
  | { ok: false; errors: string[] };

export class ConstitutionStore {
  constructor(
    private yamlPath = CONSTITUTION_YAML,
    private mdPath = CONSTITUTION_MD,
    private receipts = new ReceiptWriter(),
  ) {}

  load(): ConstitutionResult {
    mkdirSync(OTTO_DIR, { recursive: true });
    if (!existsSync(this.yamlPath)) {
      this.writeFiles(DEFAULT_CONSTITUTION);
    }
    const raw = readFileSync(this.yamlPath, 'utf8');
    const validated = validateConstitution(parse(raw));
    if (!validated.ok) {
      throw new Error(`Invalid constitution: ${validated.errors.join('; ')}`);
    }
    return {
      dir: OTTO_DIR,
      yamlPath: this.yamlPath,
      mdPath: this.mdPath,
      document: validated.document,
      rawYaml: raw,
      storage: 'files',
    };
  }

  get(): ConstitutionDocument {
    return this.load().document;
  }

  validateYaml(yamlText: string): ConstitutionValidation {
    try {
      return validateConstitution(parse(yamlText));
    } catch (e) {
      return { ok: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }

  amend(yamlText: string, amendedBy = 'user'): ConstitutionAmendResult | { blocked: true; receipt: WrittenReceipt; errors: string[] } {
    const previous = existsSync(this.yamlPath) ? readFileSync(this.yamlPath, 'utf8') : '';
    const validated = this.validateYaml(yamlText);
    if (!validated.ok) {
      const receipt = this.receipts.write({
        status: 'blocked',
        subject: { type: 'constitution', id: 'constitution.yaml' },
        action: 'constitution.amend',
        input: { amended_by: amendedBy },
        result: {
          summary: 'Constitution amend blocked — validation failed',
          data: { errors: validated.errors },
        },
        evidence: [{ kind: 'file', ref: this.yamlPath }],
        blocker: {
          code: 'constitution_invalid',
          message: validated.errors.join('; '),
          recoverable: true,
          next_action: 'Fix validation errors and save again.',
        },
      });
      return { blocked: true, receipt, errors: validated.errors };
    }

    const now = new Date().toISOString();
    const next: ConstitutionDocument = {
      ...validated.document,
      amended_at: now,
      amended_by: amendedBy,
    };
    this.writeFiles(next);

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'constitution', id: 'constitution.yaml' },
      action: 'constitution.amend',
      input: { amended_by: amendedBy, diff_chars: Math.abs(yamlText.length - previous.length) },
      result: {
        summary: `Constitution amended (${next.forbidden_actions.length} forbidden actions)`,
        data: {
          amended_at: now,
          forbidden_count: next.forbidden_actions.length,
        },
      },
      evidence: [{ kind: 'file', ref: this.yamlPath, note: 'constitution.yaml' }],
      blocker: null,
    });

    return { document: next, receipt };
  }

  checkWritebackAllowed(): { allowed: boolean; reason: string } {
    const doc = this.get();
    const policy = doc.writeback_policy;
    if (policy.mode !== 'proposal_only' || !policy.requires_curation_accept || !policy.silent_apply_forbidden) {
      return {
        allowed: false,
        reason: 'Constitution writeback_policy requires proposal-only flow with Curation accept.',
      };
    }
    return {
      allowed: true,
      reason: 'Memory changes only after you accept in Curation.',
    };
  }

  hash(): string | null {
    if (!existsSync(this.yamlPath)) return null;
    return createHash('sha256').update(readFileSync(this.yamlPath)).digest('hex').slice(0, 16);
  }

  private writeFiles(document: ConstitutionDocument): void {
    writeFileSync(this.yamlPath, stringify(document));
    writeFileSync(this.mdPath, renderMarkdown(document));
  }
}

export function validateConstitution(value: unknown): ConstitutionValidation {
  if (!isRecord(value)) return { ok: false, errors: ['Root must be an object'] };
  if (value.schema !== 'otto.constitution.v1') return { ok: false, errors: ['schema must be otto.constitution.v1'] };
  if (!isString(value.version)) return { ok: false, errors: ['version is required'] };
  if (!isStringArray(value.values)) return { ok: false, errors: ['values must be a string array'] };
  if (!isStringArray(value.forbidden_actions)) return { ok: false, errors: ['forbidden_actions must be a string array'] };
  if (!isStringArray(value.approval_rules)) return { ok: false, errors: ['approval_rules must be a string array'] };
  if (!isStringArray(value.standards_refs)) return { ok: false, errors: ['standards_refs must be a string array'] };
  if (!isStringArray(value.ratification_requirements)) return { ok: false, errors: ['ratification_requirements must be a string array'] };
  if (!isRecord(value.writeback_policy)) return { ok: false, errors: ['writeback_policy is required'] };
  const policy = value.writeback_policy;
  if (policy.mode !== 'proposal_only') return { ok: false, errors: ['writeback_policy.mode must be proposal_only'] };
  if (policy.requires_curation_accept !== true) {
    return { ok: false, errors: ['writeback_policy.requires_curation_accept must be true'] };
  }
  if (policy.silent_apply_forbidden !== true) {
    return { ok: false, errors: ['writeback_policy.silent_apply_forbidden must be true'] };
  }

  const document: ConstitutionDocument = {
    schema: 'otto.constitution.v1',
    version: value.version,
    values: value.values,
    forbidden_actions: value.forbidden_actions,
    approval_rules: value.approval_rules,
    standards_refs: value.standards_refs,
    writeback_policy: {
      mode: 'proposal_only',
      requires_curation_accept: true,
      silent_apply_forbidden: true,
    },
    ratification_requirements: value.ratification_requirements,
    amended_at: isString(value.amended_at) ? value.amended_at : undefined,
    amended_by: isString(value.amended_by) ? value.amended_by : undefined,
  };
  return { ok: true, document };
}

export function renderMarkdown(document: ConstitutionDocument): string {
  const lines = [
    '# Otto Constitution',
    '',
    `Version ${document.version}${document.amended_at ? ` · amended ${document.amended_at}` : ''}`,
    '',
    '## Values',
    ...document.values.map((v) => `- ${v}`),
    '',
    '## Forbidden actions',
    ...document.forbidden_actions.map((v) => `- ${v}`),
    '',
    '## Approval rules',
    ...document.approval_rules.map((v) => `- ${v}`),
    '',
    '## Standards references',
    ...document.standards_refs.map((v) => `- \`${v}\``),
    '',
    '## Memory writeback policy',
    `- mode: ${document.writeback_policy.mode}`,
    `- requires Curation accept: ${document.writeback_policy.requires_curation_accept}`,
    `- silent apply forbidden: ${document.writeback_policy.silent_apply_forbidden}`,
    '',
    '## Ratification requirements',
    ...document.ratification_requirements.map((v) => `- ${v}`),
    '',
    '_Machine source: `~/.otto/constitution.yaml` — edits must validate before save._',
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}
