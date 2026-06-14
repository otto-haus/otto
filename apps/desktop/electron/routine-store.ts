import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type {
  Routine,
  RoutineRecord,
  RoutineReference,
  RoutineStatus,
  RoutineStep,
  Schedule,
} from '@otto-haus/core';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';

export interface RoutineListResult {
  dir: string;
  routines: RoutineRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
}

export interface RoutineActivationGate {
  slug: string;
  requiresApproval: boolean;
  scheduled: boolean;
  allowed: boolean;
  reason: string;
}

export interface RoutineManualRunResult {
  routine: RoutineRecord;
  receipt: WrittenReceipt;
}

export class RoutineStore {
  constructor(
    private dir = resolveRoutinesDir(),
    private receipts = new ReceiptWriter(),
  ) {}

  listResult(): RoutineListResult {
    const routines: RoutineRecord[] = [];
    const skipped: RoutineListResult['skipped'] = [];

    if (!existsSync(this.dir)) {
      return { dir: this.dir, routines, skipped, storage: 'files' };
    }

    for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
      const file = join(this.dir, entry.name, 'routine.yaml');
      try {
        routines.push(readRoutine(file, entry.name));
      } catch (error) {
        skipped.push({
          slug: entry.name,
          file,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    routines.sort((a, b) => a.name.localeCompare(b.name));
    return { dir: this.dir, routines, skipped, storage: 'files' };
  }

  get(slug: string): RoutineRecord | null {
    return this.listResult().routines.find((routine) => routine.slug === slug) ?? null;
  }

  activationGate(slug: string): RoutineActivationGate {
    const routine = this.get(slug);
    if (!routine) {
      return {
        slug,
        requiresApproval: true,
        scheduled: false,
        allowed: false,
        reason: 'Routine not found.',
      };
    }

    const scheduled = !!routine.schedule;
    const requiresApproval = routine.requires_approval_to_activate === true;
    if (scheduled && requiresApproval) {
      return {
        slug,
        requiresApproval,
        scheduled,
        allowed: false,
        reason: 'Recurring/autonomous activation requires explicit approval before scheduling.',
      };
    }

    return {
      slug,
      requiresApproval,
      scheduled,
      allowed: true,
      reason: scheduled ? 'Scheduled routine may activate after approval.' : 'On-demand routine has no recurring activation gate.',
    };
  }

  runManual(slug: string): RoutineManualRunResult {
    const routine = this.get(slug);
    if (!routine) throw new Error(`Routine not found: ${slug}`);

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'routine', id: routine.id },
      action: 'routine.run.manual',
      input: {
        slug: routine.slug,
        mode: 'manual',
        steps: routine.steps,
        schedule: routine.schedule ?? null,
      },
      result: {
        summary: `Manual routine run recorded: ${routine.name}`,
        data: { stepCount: routine.steps.length },
      },
      evidence: [{ kind: 'file', ref: routine.file, note: 'Canonical routine.yaml' }],
      routine: referenceFor(routine, 'manual'),
      practice: null,
      blocker: null,
    });

    return { routine, receipt };
  }
}

export function resolveRoutinesDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_ROUTINES_DIR,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'routines') : null,
    resolve(process.cwd(), 'routines'),
    resolve(process.cwd(), '../../routines'),
    resourcesPath ? join(resourcesPath, 'routines') : null,
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return candidates[0] ?? resolve(process.cwd(), 'routines');
}

function readRoutine(file: string, fallbackSlug: string): RoutineRecord {
  const parsed = parse(readFileSync(file, 'utf8')) as unknown;
  const routine = normalizeRoutine(parsed, fallbackSlug);
  return { ...routine, file };
}

function normalizeRoutine(value: unknown, fallbackSlug: string): Routine {
  if (!isRecord(value)) throw new Error('Routine YAML must be an object');
  const steps = arrayOfRecords(value.steps).map(normalizeStep);
  if (!steps.length) throw new Error('Routine requires at least one step');

  return {
    id: requiredString(value.id, 'id'),
    slug: requiredString(value.slug, 'slug') || fallbackSlug,
    name: requiredString(value.name, 'name'),
    status: routineStatus(value.status),
    summary: requiredString(value.summary, 'summary'),
    steps,
    schedule: normalizeSchedule(value.schedule),
    attention_cost: attentionCost(value.attention_cost),
    requires_approval_to_activate: value.requires_approval_to_activate !== false,
    created_at: requiredString(value.created_at, 'created_at'),
  };
}

function normalizeStep(value: Record<string, unknown>): RoutineStep {
  return {
    practice: requiredString(value.practice, 'steps[].practice'),
    invocation: requiredString(value.invocation, 'steps[].invocation'),
    inputs: isRecord(value.inputs) ? value.inputs : undefined,
  };
}

function normalizeSchedule(value: unknown): Schedule | undefined {
  if (!isRecord(value)) return undefined;
  const schedule: Schedule = {};
  if (typeof value.cron === 'string' && value.cron.trim()) schedule.cron = value.cron.trim();
  if (typeof value.rrule === 'string' && value.rrule.trim()) schedule.rrule = value.rrule.trim();
  if (typeof value.timezone === 'string' && value.timezone.trim()) schedule.timezone = value.timezone.trim();
  return Object.keys(schedule).length ? schedule : undefined;
}

function referenceFor(routine: RoutineRecord, mode: RoutineReference['mode']): RoutineReference {
  return {
    id: routine.id,
    slug: routine.slug,
    name: routine.name,
    mode,
    ref: routine.file,
  };
}

function routineStatus(value: unknown): RoutineStatus {
  if (value === 'proposed' || value === 'trial' || value === 'active' || value === 'paused' || value === 'retired') {
    return value;
  }
  throw new Error(`Invalid Routine status: ${String(value)}`);
}

function attentionCost(value: unknown): Routine['attention_cost'] {
  if (value === 'none' || value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
}

function requiredString(value: unknown, label: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`Missing ${label}`);
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
