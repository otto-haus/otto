import { PracticeMiningLoop, type PracticeMiningObserveResult } from './practice-mining';
import { RECEIPTS_DIR } from './receipt-writer';

/**
 * First-class trigger for the receipt → practice-mining → Curation leg of the north
 * star (#636). `PracticeMiningLoop.observe()` was implemented and tested but had no
 * reachable, labs-gated entry point of its own. This gives it one.
 */
export interface PracticeMiningTriggerGated {
  gated: true;
  reason: string;
}

export type PracticeMiningTriggerResult = PracticeMiningObserveResult | PracticeMiningTriggerGated;

export function isPracticeMiningGated(
  result: PracticeMiningTriggerResult,
): result is PracticeMiningTriggerGated {
  return (result as PracticeMiningTriggerGated).gated === true;
}

export interface TriggerPracticeMiningOptions {
  /** Labs gate: practice mining only runs when Labs master + practice_mining are on. */
  enabled: boolean;
  loop?: PracticeMiningLoop;
  receiptsDir?: string;
  minOccurrences?: number;
}

/**
 * Run practice mining on demand. Scans receipts only (no conversation, never
 * `conversation=default`); drafts Practice proposals that surface in Curation and
 * writes a `practice.mining.observe` receipt. Returns a gated marker when Labs is off.
 */
export function triggerPracticeMining(opts: TriggerPracticeMiningOptions): PracticeMiningTriggerResult {
  if (!opts.enabled) {
    return {
      gated: true,
      reason: 'Practice mining is Labs-gated. Enable Labs → Practice mining to run it.',
    };
  }
  const loop = opts.loop ?? new PracticeMiningLoop();
  return loop.observe(opts.receiptsDir ?? RECEIPTS_DIR, opts.minOccurrences ?? 2);
}
