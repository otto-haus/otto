import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, parse } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defaultOttoDir } from './config-store';
import type { AttachmentInput, SavedAttachment } from './shared/types';

const MAX_BYTES = 25 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/tiff': 'tiff',
};

export function saveAttachment(input: AttachmentInput): SavedAttachment {
  const ext = EXT_BY_MIME[input.mime];
  if (!ext) throw new Error(`Unsupported attachment type: ${input.mime || 'unknown'}`);

  const match = input.dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error('Attachment must be a base64 data URL.');
  const mime = match[1];
  if (mime !== input.mime) throw new Error('Attachment MIME mismatch.');

  const data = Buffer.from(match[2], 'base64');
  if (!data.length) throw new Error('Attachment is empty.');
  if (data.byteLength > MAX_BYTES) throw new Error('Attachment is larger than 25MB.');

  const dir = join(defaultOttoDir(), 'attachments');
  mkdirSync(dir, { recursive: true });

  const id = randomUUID();
  const parsed = parse(basename(input.name || `image.${ext}`));
  const safeStem = (parsed.name || 'image').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'image';
  const name = `${safeStem}.${ext}`;
  const path = join(dir, `${Date.now()}-${id.slice(0, 8)}-${name}`);
  writeFileSync(path, data);

  return {
    id,
    name,
    mime,
    path,
    url: pathToFileURL(path).href,
    size: data.byteLength,
  };
}
