import { describe, expect, test } from 'bun:test';
import { previewCopy } from '../copy/surfaces';
import { previewFromText } from './preview-content';

describe('preview generated artifacts (#511)', () => {
  test('artifact path images show generated · not ratified badge', () => {
    const path = '/Users/seb/.otto/artifacts/1710000000-abcd1234-owl.png';
    const preview = previewFromText(`![generated owl](file://${encodeURIComponent(path)})`, {
      title: 'Generated owl',
    });
    expect(preview?.kind).toBe('image');
    expect(preview?.badge).toBe(previewCopy.generatedNotRatified);
  });

  test('user attachment paths do not get generated badge', () => {
    const path = '/Users/seb/.otto/attachments/wire.png';
    const preview = previewFromText(`![wire](file://${encodeURIComponent(path)})`);
    expect(preview?.kind).toBe('image');
    expect(preview?.badge).toBeUndefined();
  });
});
