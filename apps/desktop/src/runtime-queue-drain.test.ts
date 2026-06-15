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

  it('re-queues drained items when rt.send rejects', () => {
    expect(chatSource).toContain('void rt.send(next.text)');
    expect(chatSource).toContain('.catch(() => {');
    expect(chatSource).toContain('appendFailedQueueItem(items, next)');
  });
});
