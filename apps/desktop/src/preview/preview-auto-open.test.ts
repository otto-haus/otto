import { describe, expect, test } from 'bun:test';
import {
  isAutoOpenArtifact,
  resolvePreviewAutoOpen,
  type PreviewAutoOpenMode,
} from './preview-auto-open';

describe('isAutoOpenArtifact', () => {
  test('detects fenced HTML', () => {
    expect(isAutoOpenArtifact('Here:\n```html\n<h1>Hi</h1>\n```')).toBe(true);
  });

  test('detects bare HTML documents', () => {
    expect(isAutoOpenArtifact('<!DOCTYPE html><html><body>ok</body></html>')).toBe(true);
  });

  test('detects image-only messages', () => {
    expect(isAutoOpenArtifact('![chart](https://example.com/chart.png)')).toBe(true);
  });

  test('detects standalone markdown docs', () => {
    expect(isAutoOpenArtifact('# Design spec\n\n- item')).toBe(true);
    expect(isAutoOpenArtifact('```markdown\n# Doc\n\nBody\n```')).toBe(true);
  });

  test('ignores ordinary conversational markdown', () => {
    expect(isAutoOpenArtifact('Sure — here is the plan:\n\n- one\n- two')).toBe(false);
    expect(isAutoOpenArtifact('## Plan\n\n- one\n- two')).toBe(false);
  });
});

describe('resolvePreviewAutoOpen policy matrix', () => {
  const htmlArtifact = '```html\n<p>Artifact</p>\n```';
  const base = {
    text: htmlArtifact,
    title: 'otto reply',
    sourceId: 'msg-1',
  };

  test('off never opens', () => {
    expect(resolvePreviewAutoOpen({ ...base, mode: 'off', paneOpen: false, runtimeConnected: true }).action).toBe('skip');
  });

  test('disconnected shows toast path', () => {
    expect(resolvePreviewAutoOpen({ ...base, mode: 'always-on-pane', paneOpen: false, runtimeConnected: false }).action).toBe(
      'toast-disconnected',
    );
  });

  test('on-new-artifact opens when pane closed', () => {
    const decision = resolvePreviewAutoOpen({ ...base, mode: 'on-new-artifact', paneOpen: false, runtimeConnected: true });
    expect(decision.action).toBe('open');
    if (decision.action === 'open') expect(decision.content.kind).toBe('html');
  });

  test('on-new-artifact skips when pane already open', () => {
    const decision = resolvePreviewAutoOpen({ ...base, mode: 'on-new-artifact', paneOpen: true, runtimeConnected: true });
    expect(decision).toEqual({ action: 'skip', reason: 'pane-open' });
  });

  test('always-on-pane opens even when pane open', () => {
    const decision = resolvePreviewAutoOpen({ ...base, mode: 'always-on-pane', paneOpen: true, runtimeConnected: true });
    expect(decision.action).toBe('open');
  });

  test.each([
    ['off', false, false],
    ['on-new-artifact', false, true],
    ['on-new-artifact', true, false],
    ['always-on-pane', true, true],
  ] as const satisfies ReadonlyArray<[PreviewAutoOpenMode, boolean, boolean]>)(
    'matrix mode=%s paneOpen=%s opens=%s',
    (mode, paneOpen, shouldOpen) => {
      const decision = resolvePreviewAutoOpen({
        ...base,
        mode,
        paneOpen,
        runtimeConnected: true,
      });
      expect(decision.action === 'open').toBe(shouldOpen);
    },
  );
});
