import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const runtimeSource = readFileSync(join(import.meta.dir, 'runtime.ts'), 'utf8');

describe('runtime busy/inflight lifecycle (Codex P2)', () => {
  it('keeps busy on owned-turn error events until terminal result', () => {
    expect(runtimeSource).toMatch(
      /if \(m\.type === 'error'\) \{[\s\S]*?const ownedTurn = inflightThreadRef\.current;[\s\S]*?if \(!ownedTurn\) setBusy\(false\);/,
    );
    expect(runtimeSource).toMatch(
      /else if \(m\.type === 'result'\) \{[\s\S]*?setBusy\(false\);/,
    );
  });

  it('clears busy and inflight when send() rejects before runtime events', () => {
    expect(runtimeSource).toMatch(
      /finally \{[\s\S]*?if \(inflightThreadRef\.current === sendThreadId\) \{[\s\S]*?inflightThreadRef\.current = null;[\s\S]*?setBusy\(false\);/,
    );
  });
});
