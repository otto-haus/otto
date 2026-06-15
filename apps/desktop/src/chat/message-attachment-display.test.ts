import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ATTACHMENT_REF_PREFIX } from '../attachment-message';
import { parseSentMessageDisplay, pathToAttachmentPreviewUrl } from './message-attachment-display';

const stripSource = readFileSync(join(import.meta.dir, 'MessageAttachmentStrip.tsx'), 'utf8');

describe('parseSentMessageDisplay (#277)', () => {
  test('strips attachment footer and keeps message body', () => {
    const stored = `Review this layout.\n\nAttached local image:\n1. shot.png — ${ATTACHMENT_REF_PREFIX}11112222-3333-4444-5555-666677778888`;
    expect(parseSentMessageDisplay(stored)).toEqual({
      displayBody: 'Review this layout.',
      attachments: [{ name: 'shot.png', id: '11112222-3333-4444-5555-666677778888', path: '' }],
    });
  });

  test('hides default image-only prompt when attachments are present', () => {
    const stored = `Please inspect the attached image(s).\n\nAttached local images:\n1. wire.png — ${ATTACHMENT_REF_PREFIX}aaaa1111-bbbb-cccc-dddd-eeeeeeeeeeee`;
    expect(parseSentMessageDisplay(stored)).toEqual({
      displayBody: '',
      attachments: [{ name: 'wire.png', id: 'aaaa1111-bbbb-cccc-dddd-eeeeeeeeeeee', path: '' }],
    });
  });

  test('returns original text when no attachment footer is present', () => {
    expect(parseSentMessageDisplay('Plain message')).toEqual({
      displayBody: 'Plain message',
      attachments: [],
    });
  });
});

describe('pathToAttachmentPreviewUrl (#277)', () => {
  test('builds file URL for renderer previews', () => {
    const path = '/Users/seb/.otto/attachments/shot.png';
    expect(pathToAttachmentPreviewUrl(path)).toBe('file:///Users/seb/.otto/attachments/shot.png');
  });
});

describe('MessageAttachmentStrip (#277)', () => {
  test('renders filename chip and resolves id-based previews without leaking stored tokens', () => {
    expect(stripSource).toContain('msgAttachment__name');
    expect(stripSource).toContain('attachments.resolve');
    expect(stripSource).not.toContain(ATTACHMENT_REF_PREFIX);
  });
});
