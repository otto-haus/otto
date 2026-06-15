import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function handlerBody(src: string, channel: string, nextChannel?: string): string {
  const start = src.indexOf(`'${channel}'`);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = nextChannel ? src.indexOf(`'${nextChannel}'`, start + 1) : src.length;
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

describe('thread permission session (#643)', () => {
  test('thread lifecycle IPC clears permissionSessionStore when conversation may change', () => {
    const src = readFileSync(join(import.meta.dir, 'ipc.ts'), 'utf8');

    for (const [channel, next] of [
      ['otto:threads:create', 'otto:threads:switch'],
      ['otto:threads:switch', 'otto:threads:archive'],
      ['otto:threads:archive', 'otto:threads:unarchive'],
    ] as const) {
      expect(handlerBody(src, channel, next)).toContain('permissionSessionStore.clear()');
    }
  });
});
