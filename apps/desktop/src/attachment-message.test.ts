import { describe, expect, test } from 'bun:test';
import {
  ATTACHMENT_REF_PREFIX,
  ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
  buildRuntimeSendPayload,
  buildStoredMessageWithAttachments,
  findPathLeaksInUserVisibleText,
  formatAttachmentTrayLabel,
  parseAttachmentIdsFromStoredText,
} from './attachment-message';

describe('attachment-message delivery (#277 / #299)', () => {
  test('stored message uses otto-att ids instead of raw paths', () => {
    const path = '/Users/seb/.otto/attachments/shot.png';
    const stored = buildStoredMessageWithAttachments('Check this', [{
      id: '11112222-3333-4444-5555-666677778888',
      name: 'shot.png',
      path,
    }]);
    expect(stored).toContain(`${ATTACHMENT_REF_PREFIX}11112222-3333-4444-5555-666677778888`);
    expect(stored).not.toContain(path);
    expect(findPathLeaksInUserVisibleText(stored, [path])).toEqual([]);
  });

  test('runtime payload carries attachment paths for main-process byte delivery', () => {
    const path = '/Users/seb/.otto/attachments/wire.png';
    const payload = buildRuntimeSendPayload('Inspect', [{
      id: 'aaaa1111-bbbb-cccc-dddd-eeeeeeeeeeee',
      name: 'wire.png',
      path,
      mime: 'image/png',
    }]);
    expect(payload.promptText).toBe('Inspect');
    expect(payload.attachments[0]?.path).toBe(path);
    expect(payload.storedText).not.toContain(path);
    expect(parseAttachmentIdsFromStoredText(payload.storedText)).toEqual(['aaaa1111-bbbb-cccc-dddd-eeeeeeeeeeee']);
  });

  test('tray labels stay filename-only', () => {
    expect(formatAttachmentTrayLabel({ name: 'screenshot.png' })).toBe('screenshot.png');
    expect(formatAttachmentTrayLabel({ name: 'screenshot.png' })).not.toContain(ATTACHMENT_SMOKE_FIXTURE_DATA_URL);
  });
});
