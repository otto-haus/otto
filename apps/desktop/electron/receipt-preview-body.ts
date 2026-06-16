import { existsSync, readFileSync } from 'node:fs';
import type { ReceiptDetail, ReceiptPreviewBodyResult } from './shared/types';
import {
  findArtifactRef,
  previewContentFromReceiptDetail,
  receiptPreviewEligible,
} from '../src/preview/receipt-preview';

export type { ReceiptPreviewBodyResult } from './shared/types';

function readArtifactFile(ref: string): string | null {
  const trimmed = ref.trim();
  if (!trimmed || !existsSync(trimmed)) return null;
  try {
    return readFileSync(trimmed, 'utf8');
  } catch {
    return null;
  }
}

function inlineBodyFromDetail(detail: ReceiptDetail): { body: string; ref: string } | null {
  const data = detail.result.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  for (const key of ['html', 'markdown', 'body'] as const) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return { body: value, ref: `result.data.${key}` };
    }
  }
  return null;
}

export function receiptPreviewBodyFor(detail: ReceiptDetail | null): ReceiptPreviewBodyResult {
  const eligibility = receiptPreviewEligible(detail);
  if (!detail || !eligibility.eligible) {
    return { eligible: false, reason: eligibility.reason ?? 'Receipt not found.' };
  }

  const artifactRef = findArtifactRef(detail);
  if (artifactRef && !artifactRef.startsWith('result.data.')) {
    const body = readArtifactFile(artifactRef);
    if (body) {
      const content = previewContentFromReceiptDetail(detail, { ref: artifactRef, body });
      if (content) return { eligible: true, content };
    }
  }

  const inline = inlineBodyFromDetail(detail);
  if (inline) {
    const content = previewContentFromReceiptDetail(detail, inline);
    if (content) return { eligible: true, content };
  }

  const content = previewContentFromReceiptDetail(detail);
  if (!content) {
    return { eligible: false, reason: 'This receipt has no markdown or HTML body to render.' };
  }
  return { eligible: true, content };
}
