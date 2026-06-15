import { describe, expect, test } from 'bun:test';
import { checksCopy, cultureCiCopy, listEmpty, toastCopy, webPreviewEmpty } from './surfaces';

describe('checks copy (#127)', () => {
  test('block UX uses check failed wording, not error', () => {
    expect(checksCopy.blockEyebrow).toBe('check failed');
    expect(checksCopy.blockEyebrow).not.toMatch(/error/i);
    expect(checksCopy.blockPill).toBe('BLOCK');
  });

  test('checks surface copy is wired for Culture CI', () => {
    expect(checksCopy.title).toBe('Checks');
    expect(checksCopy.eyebrow).toBe('culture ci');
    expect(cultureCiCopy.blockHint).toContain('Failed checks');
    expect(listEmpty.checks?.title).toBe('No compiled checks yet');
  });

  test('curation toast includes check active line', () => {
    expect(toastCopy.checkActive).toBe('Check active');
  });

  test('web preview empty state exists for checks', () => {
    expect(webPreviewEmpty.checks.title).toContain('Checks');
    expect(webPreviewEmpty.checks.path).toBe('~/.otto/checks/');
  });
});
