import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const runtimeSource = readFileSync(join(import.meta.dir, 'runtime.ts'), 'utf8');
const chatSource = readFileSync(join(import.meta.dir, 'surfaces/Chat.tsx'), 'utf8');

describe('queue drain failure contract (#545)', () => {
  it('records sendError when runtime result reports success: false', () => {
    expect(runtimeSource).toContain("if ((m as { success?: boolean }).success === false)");
    expect(runtimeSource).toContain('sendError.current = String(failed.error ?? failed.reason ?? failed.message ??');
    expect(runtimeSource).toContain('if (sendError.current) throw new Error(sendError.current);');
  });

  it('persists a durable outbox row when an immediate rt.send rejects (#754)', () => {
    expect(chatSource).toContain('enqueueOutboxPayload');
    expect(chatSource).toContain('if (threadId) enqueueOutboxPayload(threadId, payload)');
  });
});

describe('thread hydration for queue drain', () => {
  it('does not mark hydration complete when threads.list returns no active thread', () => {
    expect(runtimeSource).toContain('if (!threadId) return;');
    expect(runtimeSource).toMatch(
      /void api\.threads\.list\(\)\.then\(\(result\) => \{[\s\S]*?const threadId = result\.activeThreadId;[\s\S]*?if \(!threadId\) return;[\s\S]*?threadHydrated\.current = true;/,
    );
  });

  it('always reconciles active thread after runtime init', () => {
    expect(runtimeSource).toContain('setActiveThreadId((current) => current ?? threadId);');
    expect(runtimeSource).not.toMatch(
      /\.init\(\)[\s\S]*?if \(threadHydrated\.current\) return;/,
    );
  });

  it('renders the queue banner from main-process outbox state, not a renderer drain loop (#754)', () => {
    expect(chatSource).toContain('useOutbox');
    expect(chatSource).toContain('OutboxBanner');
    expect(chatSource).not.toContain('planQueueDrain');
  });
});
