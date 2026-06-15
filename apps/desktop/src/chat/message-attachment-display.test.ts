import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MessageAttachmentStrip } from './MessageAttachmentStrip';
import { parseSentMessageDisplay, pathToAttachmentPreviewUrl } from './message-attachment-display';

describe('parseSentMessageDisplay (#277)', () => {
  test('strips attachment footer and keeps message body', () => {
    const path = '/Users/seb/.otto/attachments/shot.png';
    const text = `Inspect this screenshot.\n\nAttached local image:\n1. shot.png — ${path}`;
    expect(parseSentMessageDisplay(text)).toEqual({
      displayBody: 'Inspect this screenshot.',
      attachments: [{ name: 'shot.png', path }],
    });
  });

  test('hides default image-only prompt when attachments are present', () => {
    const path = '/Users/seb/.otto/attachments/wire.png';
    const text = `Please inspect the attached image(s).\n\nAttached local images:\n1. wire.png — ${path}`;
    expect(parseSentMessageDisplay(text)).toEqual({
      displayBody: '',
      attachments: [{ name: 'wire.png', path }],
    });
  });

  test('returns original text when no attachment footer is present', () => {
    expect(parseSentMessageDisplay('Plain message')).toEqual({
      displayBody: 'Plain message',
      attachments: [],
    });
  });
});

describe('pathToAttachmentPreviewUrl', () => {
  test('normalizes absolute paths to file URLs', () => {
    expect(pathToAttachmentPreviewUrl('/tmp/a.png')).toBe('file:///tmp/a.png');
    expect(pathToAttachmentPreviewUrl('file:///tmp/a.png')).toBe('file:///tmp/a.png');
  });
});

describe('MessageAttachmentStrip (#277)', () => {
  test('renders thumbnails and filenames without raw paths', () => {
    const path = '/Users/seb/.otto/attachments/shot.png';
    const html = renderToStaticMarkup(createElement(MessageAttachmentStrip, {
      attachments: [{ name: 'shot.png', path }],
    }));

    expect(html).toContain('msgAttachmentStrip');
    expect(html).toContain('file:///Users/seb/.otto/attachments/shot.png');
    expect(html).toContain('shot.png');
    expect(html).not.toContain('Attached local image');
    expect(html).not.toContain(' — /Users');
  });
});
