import PQueue from 'p-queue';
import { buildRuntimePromptText, type RuntimeSendPayload } from '../../src/attachment-message';
import { classifySendError, classifyUnavailable, type RuntimeStatusLike } from './errors';
import { parseAttachments, type OutboxStore } from './store';

/**
 * Port the pump uses to actually drive Letta. The pump is the in-memory EXECUTOR; the durable
 * SQLite rows are the source of truth. `send` resolves when the turn completes and rejects on
 * failure; `onStreaming` is called once the runtime starts streaming back.
 */
export interface RuntimeSendPort {
  getStatus(): RuntimeStatusLike;
  send(input: RuntimeSendPayload | string, hooks?: { onStreaming?: () => void }): Promise<void>;
}

export type PumpHooks = { onChange?: (threadId: string) => void };

/**
 * In-memory drain pump. `p-queue` with concurrency 1 guarantees one in-flight turn at a time
 * (designed to move to concurrency-1-per-Letta-session later). p-queue is NOT durable state — it
 * only schedules drains of the durable queue.
 */
export class QueuePump {
  private readonly queue = new PQueue({ concurrency: 1 });

  constructor(
    private readonly store: OutboxStore,
    private readonly port: RuntimeSendPort,
    private readonly hooks: PumpHooks = {},
  ) {}

  /** Schedule a drain pass for a thread. Safe to call repeatedly (coalesced by the serial queue). */
  schedule(threadId: string): void {
    void this.queue.add(() => this.drainThread(threadId));
  }

  /** Resolve when the pump is idle (tests). */
  onIdle(): Promise<void> {
    return this.queue.onIdle();
  }

  private notify(threadId: string): void {
    this.hooks.onChange?.(threadId);
  }

  private async drainThread(threadId: string): Promise<void> {
    // Serial loop: drain queued rows oldest-first until empty or a stop condition (blocked/failed).
    for (;;) {
      const item = this.store.nextQueued(threadId);
      if (!item) return;

      const status = this.port.getStatus();
      if (!status.ready) {
        const disposition = classifyUnavailable(status);
        this.store.markBlocked(item.id, disposition);
        this.store.appendTurnEvent({
          queueItemId: item.id,
          threadId,
          type: 'error',
          status: 'blocked',
          title: 'Runtime unavailable',
          body: disposition.errorMessage ?? disposition.errorCode,
        });
        this.notify(threadId);
        return; // Stay blocked until the operator changes the runtime; reschedule on init.
      }

      this.store.markSending(item.id);
      this.store.appendTurnEvent({
        queueItemId: item.id,
        threadId,
        type: 'checkpoint',
        status: 'started',
        title: 'Sending',
        startedAt: Date.now(),
      });
      this.notify(threadId);

      try {
        const attachments = parseAttachments(item.attachmentsJson);
        const sendInput: RuntimeSendPayload | string = attachments.length
          ? {
            storedText: item.text,
            promptText: buildRuntimePromptText('', attachments.map((a, index) => ({ id: `${item.id}-att-${index}`, name: a.name, path: a.path ?? '' }))),
            attachments: attachments.map((a, index) => ({
              id: `${item.id}-att-${index}`,
              name: a.name,
              path: a.path ?? '',
              mime: a.mime ?? 'application/octet-stream',
            })),
          }
          : item.text;
        await this.port.send(sendInput, {
          onStreaming: () => {
            this.store.markStreaming(item.id);
            this.notify(threadId);
          },
        });
        this.store.markSent(item.id);
        this.store.appendTurnEvent({
          queueItemId: item.id,
          threadId,
          type: 'receipt',
          status: 'done',
          title: 'Sent',
          endedAt: Date.now(),
        });
        this.notify(threadId);
        // Continue draining the next queued row for this thread.
      } catch (err) {
        const disposition = classifySendError(err);
        if (disposition.kind === 'blocked') this.store.markBlocked(item.id, disposition);
        else this.store.markFailed(item.id, disposition);
        this.store.appendTurnEvent({
          queueItemId: item.id,
          threadId,
          type: 'error',
          status: disposition.kind,
          title: disposition.kind === 'blocked' ? 'Runtime unavailable' : 'Send failed',
          body: disposition.errorMessage ?? disposition.errorCode,
          endedAt: Date.now(),
        });
        this.notify(threadId);
        return; // Stop this pass; the row is failed/blocked and won't auto-drain.
      }
    }
  }
}
