import { describe, expect, test } from 'bun:test';
import type { PreviewContent } from './preview-content';
import {
  canGoPreviewHistoryBack,
  canGoPreviewHistoryForward,
  createPreviewHistoryState,
  derivePreviewTitle,
  goPreviewHistoryBack,
  goPreviewHistoryForward,
  PREVIEW_HISTORY_MAX_DEPTH,
  previewArtifactKey,
  pushPreviewHistory,
  withDerivedPreviewTitle,
} from './preview-history';

const markdownFixture = (body: string, sourceId?: string): PreviewContent => ({
  title: 'Preview',
  kind: 'markdown',
  body,
  sourceId,
});

const htmlFixture = (body: string, sourceId?: string, blockIndex?: number): PreviewContent => ({
  title: 'HTML artifact',
  kind: 'html',
  body,
  sourceId,
  blockIndex,
});

describe('previewArtifactKey', () => {
  test('uses message id and block index', () => {
    expect(previewArtifactKey({ sourceId: 'msg-1', blockIndex: 2, kind: 'html', body: '<p>a</p>' })).toBe('msg-1:2');
    expect(previewArtifactKey({ sourceId: 'msg-1', kind: 'markdown', body: '# Hi' })).toBe('msg-1:0');
  });
});

describe('derivePreviewTitle', () => {
  test('prefers first markdown heading', () => {
    const title = derivePreviewTitle(markdownFixture('# Release notes\n\nBody'));
    expect(title).toBe('Release notes');
  });

  test('falls back to HTML artifact turn label', () => {
    const title = derivePreviewTitle(htmlFixture('<html><body><p>Hi</p></body></html>'), { turnNumber: 3 });
    expect(title).toBe('HTML artifact · turn 3');
  });
});

describe('pushPreviewHistory', () => {
  test('push advances index and exposes content', () => {
    let state = createPreviewHistoryState();
    state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture('# One\n\na', 'm1')));
    state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture('# Two\n\nb', 'm2')));

    expect(state.index).toBe(1);
    expect(state.entries).toHaveLength(2);
    expect(state.entries[1]?.content.title).toBe('Two');
  });

  test('dedupes when opening the same artifact again', () => {
    let state = createPreviewHistoryState();
    const first = withDerivedPreviewTitle(htmlFixture('<html><body>v1</body></html>', 'm1', 0));
    const duplicate = withDerivedPreviewTitle(htmlFixture('<html><body>v1</body></html>', 'm1', 0));

    state = pushPreviewHistory(state, first);
    const before = state;
    state = pushPreviewHistory(state, duplicate);

    expect(state).toEqual(before);
    expect(state.entries).toHaveLength(1);
  });

  test('truncates forward branch when pushing after back', () => {
    let state = createPreviewHistoryState();
    state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture('# A', 'a')));
    state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture('# B', 'b')));
    state = goPreviewHistoryBack(state)!;
    state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture('# C', 'c')));

    expect(state.entries.map((entry) => entry.content.title)).toEqual(['A', 'C']);
    expect(state.index).toBe(1);
    expect(canGoPreviewHistoryForward(state)).toBe(false);
  });

  test('drops oldest entries beyond max depth', () => {
    let state = createPreviewHistoryState();
    for (let i = 0; i < PREVIEW_HISTORY_MAX_DEPTH + 5; i += 1) {
      state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture(`# Item ${i}`, `m-${i}`)));
    }
    expect(state.entries).toHaveLength(PREVIEW_HISTORY_MAX_DEPTH);
    expect(state.entries[0]?.content.title).toBe('Item 5');
    expect(state.entries.at(-1)?.content.title).toBe(`Item ${PREVIEW_HISTORY_MAX_DEPTH + 4}`);
  });
});

describe('goPreviewHistoryBack/Forward', () => {
  test('navigates and disables at bounds', () => {
    let state = createPreviewHistoryState();
    state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture('# One', 'm1')));
    state = pushPreviewHistory(state, withDerivedPreviewTitle(markdownFixture('# Two', 'm2')));

    expect(canGoPreviewHistoryBack(state)).toBe(true);
    expect(canGoPreviewHistoryForward(state)).toBe(false);

    state = goPreviewHistoryBack(state)!;
    expect(state.entries[state.index]?.content.title).toBe('One');
    expect(canGoPreviewHistoryBack(state)).toBe(false);
    expect(canGoPreviewHistoryForward(state)).toBe(true);

    state = goPreviewHistoryForward(state)!;
    expect(state.entries[state.index]?.content.title).toBe('Two');
  });
});
