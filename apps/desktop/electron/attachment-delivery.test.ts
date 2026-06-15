import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
  buildRuntimeSendPayload,
  findPathLeaksInUserVisibleText,
  formatAttachmentTrayLabel,
} from '../src/attachment-message';
import {
  buildAttachmentDeliveryContent,
  prepareRuntimeSend,
  resolveAttachmentPath,
  resolveAttachmentRecord,
} from './attachment-delivery';
import { saveAttachment } from './attachments';

const originalConfigDir = process.env.OTTO_CONFIG_DIR;

afterEach(() => {
  if (originalConfigDir === undefined) Reflect.deleteProperty(process.env, 'OTTO_CONFIG_DIR');
  else process.env.OTTO_CONFIG_DIR = originalConfigDir;
});

describe('attachment delivery (#277 / #299)', () => {
  test('reads fixture bytes into multimodal Letta content instead of redacted path text', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-attachment-delivery-'));
    process.env.OTTO_CONFIG_DIR = dir;

    const saved = saveAttachment({
      name: 'dogfood-screenshot.png',
      mime: 'image/png',
      dataUrl: ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
    });
    const payload = buildRuntimeSendPayload('Inspect this screenshot.', [saved]);
    const prepared = prepareRuntimeSend(payload);

    expect(prepared.storedText).not.toContain(saved.path);
    expect(prepared.attachmentCount).toBe(1);
    expect(prepared.deliveryContent.length).toBe(2);
    expect(prepared.deliveryContent[0]).toEqual({ type: 'text', text: 'Inspect this screenshot.' });
    const imagePart = prepared.deliveryContent[1];
    expect(imagePart?.type).toBe('image');
    if (imagePart?.type === 'image') {
      expect(imagePart.source.type).toBe('base64');
      expect(imagePart.source.data.length).toBeGreaterThan(0);
      expect(imagePart.source.data).toBe(readFileSync(saved.path).toString('base64'));
    }
    expect(prepared.deliveryContent.join(' ')).not.toContain('[redacted: local path]');
  });

  test('resolves saved attachment ids from stored queue text on drain', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-attachment-delivery-queue-'));
    process.env.OTTO_CONFIG_DIR = dir;
    const saved = saveAttachment({
      name: 'queue-shot.png',
      mime: 'image/png',
      dataUrl: ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
    });
    const payload = buildRuntimeSendPayload('', [saved]);
    const prepared = prepareRuntimeSend({
      storedText: payload.storedText,
      promptText: '',
      attachments: [],
    });
    expect(prepared.attachmentCount).toBe(1);
    expect(prepared.deliveryContent[1]?.type).toBe('image');
  });

  test('keeps local paths out of user-visible attachment tray labels', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-attachment-delivery-tray-'));
    process.env.OTTO_CONFIG_DIR = dir;
    const saved = saveAttachment({
      name: 'pasted screenshot.png',
      mime: 'image/png',
      dataUrl: ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
    });
    const trayLabel = formatAttachmentTrayLabel(saved);
    expect(trayLabel).toBe('pasted-screenshot.png');
    expect(findPathLeaksInUserVisibleText(trayLabel, [saved.path, dir])).toEqual([]);
  });

  test('resolveAttachmentPath finds files by id prefix', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-attachment-delivery-resolve-'));
    process.env.OTTO_CONFIG_DIR = dir;
    const saved = saveAttachment({
      name: 'resolve-me.png',
      mime: 'image/png',
      dataUrl: ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
    });
    expect(resolveAttachmentPath(saved.id)).toBe(saved.path);
    expect(resolveAttachmentRecord(saved.id)?.name).toBe(saved.name);
    expect(existsSync(resolveAttachmentPath(saved.id)!)).toBe(true);
  });

  test('reports honest failure when attachment bytes cannot be read', () => {
    const { errors } = buildAttachmentDeliveryContent('Inspect', [{
      id: 'missing-id',
      name: 'missing.png',
      path: '/tmp/does-not-exist.png',
      mime: 'image/png',
    }]);
    expect(errors).toEqual([{ name: 'missing.png', message: 'Attachment file is missing on disk.' }]);
  });
});
