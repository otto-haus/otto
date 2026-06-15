import { describe, expect, test } from 'bun:test';
import {
  accumulateMarkdownBlocks,
  blockRenderKey,
  type BlockAccumulatorSnapshot,
} from './block-accumulator';
import {
  ACTIVITY_BETWEEN_BLOCKS_STREAM,
  appendChunks,
  buildHugeStreamChunks,
  GFM_TABLE_STREAM,
  LOCAL_PATH_REDACTION_SAMPLE,
  NESTED_LIST_STREAM,
  OPEN_FENCE_CHUNKS,
  SECRET_REDACTION_SAMPLE,
} from './fixtures';
import { redactForDisplay } from './redact-for-display';

function streamAccumulate(chunks: string[], finalizeLast = true): BlockAccumulatorSnapshot {
  let state: BlockAccumulatorSnapshot | undefined;
  let text = '';
  for (let i = 0; i < chunks.length; i += 1) {
    text += chunks[i];
    const finalize = finalizeLast && i === chunks.length - 1;
    state = accumulateMarkdownBlocks(state, text, finalize);
  }
  return state!;
}

describe('block-accumulator', () => {
  test('seals prose blocks on blank lines while streaming', () => {
    const chunks = ['Hello', ' world.', '\n\n', 'Next block.'];
    const mid = streamAccumulate(chunks.slice(0, 3), false);
    expect(mid.sealed).toHaveLength(1);
    expect(mid.sealed[0].markdown).toBe('Hello world.');
    expect(mid.tail).toBe('');
    const done = streamAccumulate(chunks, true);
    expect(done.sealed).toHaveLength(2);
    expect(done.tail).toBe('');
  });

  test('keeps open code fence in tail until closed', () => {
    const mid = streamAccumulate(OPEN_FENCE_CHUNKS.slice(0, 4), false);
    expect(mid.sealed).toHaveLength(1);
    expect(mid.sealed[0].markdown).toBe('Intro paragraph.');
    expect(mid.tail).toContain('```ts');
    expect(mid.tail).not.toContain('```\nconst y');

    const done = streamAccumulate([...OPEN_FENCE_CHUNKS, '\n```'], true);
    expect(done.sealed).toHaveLength(2);
    expect(done.sealed[1].kind).toBe('code');
    expect(done.tail).toBe('');
  });

  test('seals completed GFM table as table block', () => {
    const snapshot = accumulateMarkdownBlocks(undefined, GFM_TABLE_STREAM, true);
    expect(snapshot.sealed.some((block) => block.kind === 'table')).toBe(true);
    expect(snapshot.sealed.at(-1)?.markdown).toBe('Done.');
  });

  test('preserves nested list content inside a single sealed block', () => {
    const snapshot = streamAccumulate(NESTED_LIST_STREAM, true);
    expect(snapshot.sealed[0].markdown).toContain('- Parent item');
    expect(snapshot.sealed[0].markdown).toContain('  - Child one');
    expect(snapshot.sealed[1].markdown).toBe('After list.');
  });

  test('handles activity-span gaps between independently sealed blocks', () => {
    const snapshot = streamAccumulate(ACTIVITY_BETWEEN_BLOCKS_STREAM, true);
    expect(snapshot.sealed).toHaveLength(3);
    expect(snapshot.sealed[0].markdown).toBe('# Summary');
    expect(snapshot.sealed[1].markdown).toBe('First sealed block.');
    expect(snapshot.sealed[2].markdown).toBe('Second sealed block after activity gap.');
  });

  test('append-only updates preserve sealed block object identity', () => {
    let state: BlockAccumulatorSnapshot | undefined;
    const keys: string[][] = [];
    let text = '';
    const chunks = ['Block one.', '\n\n', 'Block two.', '\n\n', 'Block three partial'];
    for (const chunk of chunks) {
      text += chunk;
      state = accumulateMarkdownBlocks(state, text, false);
      keys.push(state.sealed.map((block) => blockRenderKey(block.markdown, block.kind, block.ordinal)));
    }

    expect(keys[1][0]).toBe(keys[2][0]);
    expect(state!.sealed[0]).toBe(state!.sealed[0]);
    const firstBlockAfterSecond = state!.sealed[0];
    state = accumulateMarkdownBlocks(state, text + ' tail', false);
    expect(state!.sealed[0]).toBe(firstBlockAfterSecond);
    expect(state!.sealed[1]?.markdown).toBe('Block two.');
  });

  test('appends ~10k chunks without quadratic sealed-block growth', () => {
    const chunks = buildHugeStreamChunks();
    const started = performance.now();
    let state: BlockAccumulatorSnapshot | undefined;
    let text = '';
    for (const chunk of chunks) {
      text += chunk;
      state = accumulateMarkdownBlocks(state, text, false);
    }
    const elapsed = performance.now() - started;
    expect(state!.sealed.length).toBeGreaterThan(100);
    expect(elapsed).toBeLessThan(2_000);
  });
});

describe('redact-for-display', () => {
  test('redacts secrets before markdown parse', () => {
    const out = redactForDisplay(SECRET_REDACTION_SAMPLE);
    expect(out).toContain('[redacted: secret]');
    expect(out).not.toContain('sk-live-');
    expect(out).not.toContain('Bearer eyJ');
  });

  test('redacts local absolute paths before markdown parse', () => {
    const out = redactForDisplay(LOCAL_PATH_REDACTION_SAMPLE);
    expect(out).toContain('[redacted: local path]');
    expect(out).not.toContain('/Users/seb/.otto');
  });
});

describe('huge streamed response fixture', () => {
  test('finalizes into stable sealed blocks', () => {
    const text = appendChunks(buildHugeStreamChunks(200, 16));
    const snapshot = accumulateMarkdownBlocks(undefined, text, true);
    expect(snapshot.sealed.length).toBeGreaterThan(5);
    expect(snapshot.tail).toBe('');
  });
});
