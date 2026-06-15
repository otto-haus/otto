import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const runtimeSource = readFileSync(join(import.meta.dir, 'runtime.ts'), 'utf8');

describe('runtime busy/inflight lifecycle (Codex P2)', () => {
  it('keeps busy on owned-turn error events until send() settles', () => {
    expect(runtimeSource).toMatch(
      /if \(m\.type === 'error'\) \{[\s\S]*?const ownedTurn = inflightThreadRef\.current;[\s\S]*?if \(!ownedTurn\) setBusy\(false\);/,
    );
    expect(runtimeSource).toMatch(
      /else if \(m\.type === 'result'\) \{[\s\S]*?setBusy\(false\);/,
    );
  });

  it('always releases busy when send() settles even if error cleared inflight first', () => {
    expect(runtimeSource).toMatch(
      /finally \{[\s\S]*?if \(inflightThreadRef\.current === sendThreadId\) \{[\s\S]*?inflightThreadRef\.current = null;[\s\S]*?\}[\s\S]*?setBusy\(false\);/,
    );
  });

  // Blocker #1: attachTrailToLastAssistant runs through patchInflightMessages, which no-ops once
  // inflightThreadRef is null. Both terminal branches must finalize the trail BEFORE clearing it,
  // otherwise the collapsed trail chip never persists onto the answer.
  it('finalizes the turn trail before clearing inflight on result', () => {
    expect(runtimeSource).toMatch(
      /else if \(m\.type === 'result'\) \{[\s\S]*?finalizeTurnTrail\(null\);[\s\S]*?inflightThreadRef\.current = null;/,
    );
  });

  it('finalizes the turn trail before clearing inflight on error', () => {
    expect(runtimeSource).toMatch(
      /if \(m\.type === 'error'\) \{[\s\S]*?finalizeTurnTrail\(null\);[\s\S]*?inflightThreadRef\.current = null;/,
    );
  });
});
