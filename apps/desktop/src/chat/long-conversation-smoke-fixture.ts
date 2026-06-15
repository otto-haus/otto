import type { SavedAttachment } from '../runtime';
import type { QueueItem } from './queue-storage';

/** Marker embedded in seeded smoke messages for pass/fail attribution. */
export const LONG_CONV_SMOKE_MARKER = '323-long-conv-smoke';

export const LONG_CONV_PERF_THRESHOLDS = {
  hydrateMs: 8000,
  scrollTailMs: 600,
  actionProbeMs: 1200,
  minMsgRows: 30,
  minReceiptCards: 5,
  minMessageActions: 3,
} as const;

export type LongConvSmokeFixture = {
  marker: string;
  messages: Array<Record<string, unknown>>;
  queue: QueueItem[];
  attachments: SavedAttachment[];
  expected: {
    messageCount: number;
    receiptCards: number;
    ottoMessagesWithActions: number;
  };
};

export type LongConvPerfMetrics = {
  hydrateMs: number;
  scrollTailMs: number;
  actionProbeMs: number;
  msgRowCount: number;
  receiptCardCount: number;
  messageActionCount: number;
  queueVisible: boolean;
  attachmentTrayVisible: boolean;
  ready: boolean;
};

export type LongConvPerfEvaluation = {
  ok: boolean;
  failures: string[];
  bottleneck: string | null;
};

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function buildLongConversationSmokeFixture(runId: string): LongConvSmokeFixture {
  const marker = `${LONG_CONV_SMOKE_MARKER}-${runId}`;
  const messages: Array<Record<string, unknown>> = [];
  let receiptCards = 0;
  let ottoMessagesWithActions = 0;

  for (let i = 0; i < 96; i += 1) {
    const isUser = i % 3 === 0;
    const isError = i % 17 === 0;
    const who = isError ? 'error' : isUser ? 'user' : 'otto';
    const id = `323-msg-${i}-${runId}`;
    const baseText = isUser
      ? `Operator turn ${i}: ${marker} — paste-friendly copy block with \`inline code\` and a short plan.`
      : isError
        ? `Runtime hiccup on turn ${i}. ${marker}`
        : `otto turn ${i}: ${marker}\n\n- tool output summary\n- follow-up question\n\n\`\`\`txt\nlog line ${i}\n\`\`\``;

    const msg: Record<string, unknown> = { id, who, text: baseText };

    if (!isUser && !isError && i % 4 === 1) {
      msg.receiptInline = {
        id: `rcpt-${i}-${runId}`,
        status: i % 8 === 1 ? 'blocked' : 'success',
        action: `tool.run.${i % 5}`,
        summary: `Activity card ${i} for ${marker}`,
        authority: 'human (permission gate)',
      };
      receiptCards += 1;
    }

    if (!isUser && !isError && i % 11 === 2) {
      msg.checkBlock = {
        checkName: `check-${i}`,
        message: `Check block ${i} blocked downstream work.`,
        receiptId: `rcpt-block-${i}`,
        standardId: `std-${i % 3}`,
      };
    }

    if (who === 'otto' && typeof msg.text === 'string' && msg.text.length > 0) {
      ottoMessagesWithActions += 1;
    }

    messages.push(msg);
  }

  const now = Date.now();
  const queue: QueueItem[] = [
    {
      id: `323-queue-queued-${runId}`,
      text: `Follow-up after long thread review (${marker}).`,
      createdAt: now - 5000,
      state: 'queued',
    },
    {
      id: `323-queue-failed-${runId}`,
      text: `Failed steer while runtime was busy (${marker}).`,
      createdAt: now - 3000,
      state: 'failed',
    },
  ];

  const attachments: SavedAttachment[] = [
    {
      id: `323-attach-${runId}`,
      name: `perf-smoke-${runId}.png`,
      mime: 'image/png',
      path: `/tmp/otto-smoke/${runId}.png`,
      url: TINY_PNG,
      size: 68,
    },
  ];

  return {
    marker,
    messages,
    queue,
    attachments,
    expected: {
      messageCount: messages.length,
      receiptCards,
      ottoMessagesWithActions,
    },
  };
}

export function evaluateLongConversationPerf(metrics: LongConvPerfMetrics): LongConvPerfEvaluation {
  const failures: string[] = [];
  let bottleneck: string | null = null;

  const fail = (reason: string, likely: string) => {
    failures.push(reason);
    if (!bottleneck) bottleneck = likely;
  };

  if (metrics.hydrateMs > LONG_CONV_PERF_THRESHOLDS.hydrateMs) {
    fail(
      `hydrateMs ${metrics.hydrateMs} > ${LONG_CONV_PERF_THRESHOLDS.hydrateMs}`,
      'initial render / message hydration',
    );
  }
  if (metrics.scrollTailMs > LONG_CONV_PERF_THRESHOLDS.scrollTailMs) {
    fail(
      `scrollTailMs ${metrics.scrollTailMs} > ${LONG_CONV_PERF_THRESHOLDS.scrollTailMs}`,
      'scroll layout / stream height',
    );
  }
  if (metrics.actionProbeMs > LONG_CONV_PERF_THRESHOLDS.actionProbeMs) {
    fail(
      `actionProbeMs ${metrics.actionProbeMs} > ${LONG_CONV_PERF_THRESHOLDS.actionProbeMs}`,
      'interaction handlers / message actions',
    );
  }
  if (metrics.msgRowCount < LONG_CONV_PERF_THRESHOLDS.minMsgRows) {
    fail(
      `msgRowCount ${metrics.msgRowCount} < ${LONG_CONV_PERF_THRESHOLDS.minMsgRows}`,
      'message parsing / DOM render',
    );
  }
  if (metrics.receiptCardCount < LONG_CONV_PERF_THRESHOLDS.minReceiptCards) {
    fail(
      `receiptCardCount ${metrics.receiptCardCount} < ${LONG_CONV_PERF_THRESHOLDS.minReceiptCards}`,
      'activity card render',
    );
  }
  if (metrics.messageActionCount < LONG_CONV_PERF_THRESHOLDS.minMessageActions) {
    fail(
      `messageActionCount ${metrics.messageActionCount} < ${LONG_CONV_PERF_THRESHOLDS.minMessageActions}`,
      'message action affordances',
    );
  }
  if (!metrics.ready) {
    fail('ready=false (queue + attachment affordances require runtime ready)', 'runtime readiness / Letta connection');
  } else {
    if (!metrics.queueVisible) fail('queueVisible=false', 'queue strip render');
    if (!metrics.attachmentTrayVisible) fail('attachmentTrayVisible=false', 'attachment tray render');
  }

  return { ok: failures.length === 0, failures, bottleneck };
}
