import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defaultOttoDir } from './config-store';

export type GeneratedArtifactProvenance = {
  prompt: string;
  model: string;
  source: 'image_gen';
  createdAt: string;
  /** Generated artifacts are never auto-canon until ratified (#511). */
  ratified: false;
};

export type GeneratedArtifact = {
  id: string;
  name: string;
  mime: string;
  path: string;
  url: string;
  size: number;
  provenance: GeneratedArtifactProvenance;
  receiptPath?: string;
};

const ARTIFACTS_DIR_NAME = 'artifacts';
const MAX_BYTES = 25 * 1024 * 1024;

export function artifactsDir(): string {
  return join(defaultOttoDir(), ARTIFACTS_DIR_NAME);
}

export function isGeneratedArtifactPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  const dir = artifactsDir().replace(/\\/g, '/');
  return normalized.startsWith(`${dir}/`) || normalized.includes('/.otto/artifacts/');
}

export function saveGeneratedArtifact(input: {
  imageBytes: Buffer;
  mime: string;
  prompt: string;
  model: string;
  receiptPath?: string;
}): GeneratedArtifact {
  if (!input.imageBytes.length) throw new Error('Generated image is empty.');
  if (input.imageBytes.byteLength > MAX_BYTES) throw new Error('Generated image is larger than 25MB.');

  const ext = mimeToExt(input.mime);
  const dir = artifactsDir();
  mkdirSync(dir, { recursive: true });

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const safePromptStem = input.prompt
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'generated';
  const name = `${safePromptStem}.${ext}`;
  const path = join(dir, `${Date.now()}-${id.slice(0, 8)}-${name}`);
  writeFileSync(path, input.imageBytes);

  const provenance: GeneratedArtifactProvenance = {
    prompt: input.prompt,
    model: input.model,
    source: 'image_gen',
    createdAt,
    ratified: false,
  };
  writeFileSync(`${path}.meta.json`, `${JSON.stringify(provenance, null, 2)}\n`);

  return {
    id,
    name,
    mime: input.mime,
    path,
    url: pathToFileURL(path).href,
    size: input.imageBytes.byteLength,
    provenance,
    receiptPath: input.receiptPath,
  };
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/png': return 'png';
    case 'image/jpeg':
    case 'image/jpg': return 'jpg';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    default: return 'png';
  }
}
