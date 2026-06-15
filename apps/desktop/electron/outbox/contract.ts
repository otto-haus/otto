import { z } from 'zod';
import { QUEUE_STATES, TURN_EVENT_TYPES, type QueueItemRow, type TurnEventRow } from './schema';
import { parseAttachments } from './store';
import type { OutboxAttachmentRef } from './redaction';

/**
 * Zod is the trust boundary on every IPC/event payload (#754 req 9). The renderer never trusts
 * malformed runtime events, and the main process never trusts renderer input. All renderer-facing
 * shapes are derived from the durable rows AFTER redaction, so no secrets/raw paths cross the IPC.
 */

export const attachmentRefSchema = z.object({
  name: z.string().max(500),
  path: z.string().max(2000).optional(),
  mime: z.string().max(200).optional(),
});

export const enqueueRequestSchema = z.object({
  threadId: z.string().min(1),
  text: z.string(),
  clientMessageId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1).optional(),
  attachments: z.array(attachmentRefSchema).optional(),
  model: z.string().nullish(),
  effort: z.string().nullish(),
  priority: z.number().int().optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
});
export type EnqueueRequest = z.infer<typeof enqueueRequestSchema>;

export const itemIdSchema = z.object({ id: z.string().min(1) });
export const threadScopeSchema = z.object({ threadId: z.string().min(1).nullish() });

export const queueStateSchema = z.enum(QUEUE_STATES);

export const queueItemViewSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  clientMessageId: z.string(),
  text: z.string(),
  attachments: z.array(attachmentRefSchema),
  model: z.string().nullable(),
  effort: z.string().nullable(),
  state: queueStateSchema,
  attemptCount: z.number(),
  maxAttempts: z.number(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
});
export type QueueItemView = z.infer<typeof queueItemViewSchema>;

export const turnEventViewSchema = z.object({
  id: z.string(),
  queueItemId: z.string(),
  threadId: z.string(),
  parentId: z.string().nullable(),
  seq: z.number(),
  type: z.enum(TURN_EVENT_TYPES),
  status: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  payloadRef: z.string().nullable(),
  createdAt: z.number(),
  startedAt: z.number().nullable(),
  endedAt: z.number().nullable(),
});
export type TurnEventView = z.infer<typeof turnEventViewSchema>;

export const queueItemDetailViewSchema = queueItemViewSchema.extend({
  turnEvents: z.array(turnEventViewSchema),
});
export type QueueItemDetailView = z.infer<typeof queueItemDetailViewSchema>;

export const outboxSnapshotSchema = z.object({
  threadId: z.string().nullable(),
  items: z.array(queueItemViewSchema),
  updatedAt: z.number(),
});
export type OutboxSnapshot = z.infer<typeof outboxSnapshotSchema>;

export const recallResultSchema = z.object({
  text: z.string(),
  attachments: z.array(attachmentRefSchema),
});
export type RecallResult = z.infer<typeof recallResultSchema>;

// ── mappers (durable row → renderer-safe view) ──────────────────────────────

export function toQueueItemView(row: QueueItemRow, attachments?: OutboxAttachmentRef[]): QueueItemView {
  return {
    id: row.id,
    threadId: row.threadId,
    clientMessageId: row.clientMessageId,
    text: row.text,
    attachments: (attachments ?? parseAttachments(row.attachmentsJson)) as QueueItemView['attachments'],
    model: row.model,
    effort: row.effort,
    state: row.state,
    attemptCount: row.attemptCount,
    maxAttempts: row.maxAttempts,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
  };
}

export function toTurnEventView(row: TurnEventRow): TurnEventView {
  return {
    id: row.id,
    queueItemId: row.queueItemId,
    threadId: row.threadId,
    parentId: row.parentId,
    seq: row.seq,
    type: row.type,
    status: row.status,
    title: row.title,
    body: row.body,
    payloadRef: row.payloadRef,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
  };
}
