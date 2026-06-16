import type { ReceiptDetail } from '../runtime';
import type { PreviewContent } from './preview-content';
import { previewFromText } from './preview-content';

const MARKDOWN_EXT = /\.(md|markdown)$/i;
const HTML_EXT = /\.(html?|htm)$/i;

export type ReceiptPreviewEligibility = {
  eligible: boolean;
  reason?: string;
};

export function receiptPreviewEligible(detail: ReceiptDetail | null | undefined): ReceiptPreviewEligibility {
  if (!detail) {
    return { eligible: false, reason: 'Select a receipt to preview.' };
  }
  if (findArtifactRef(detail)) {
    return { eligible: true };
  }
  const markdown = receiptDetailToMarkdown(detail);
  if (!markdown.trim()) {
    return { eligible: false, reason: 'This receipt has no markdown or HTML body to render.' };
  }
  return { eligible: true };
}

export function findArtifactRef(detail: ReceiptDetail): string | null {
  for (const entry of detail.evidence) {
    if (entry.kind !== 'file') continue;
    const ref = entry.ref.trim();
    if (MARKDOWN_EXT.test(ref) || HTML_EXT.test(ref)) return ref;
  }
  const data = detail.result.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const key of ['markdown', 'html', 'body'] as const) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) return `result.data.${key}`;
    }
  }
  return null;
}

export function receiptDetailToMarkdown(detail: ReceiptDetail): string {
  const lines: string[] = [
    `# Receipt \`${detail.id}\``,
    '',
    `**Status:** ${detail.status}`,
    `**Action:** ${detail.action}`,
    `**When:** ${detail.timestamp}`,
    `**Subject:** ${detail.subject.type}${detail.subject.id ? `:${detail.subject.id}` : ''}`,
    '',
    '## Outcome',
    '',
    detail.result.summary,
  ];

  if (detail.blocker) {
    lines.push('', '## Blocker', '', `**${detail.blocker.code}** — ${detail.blocker.message}`);
    if (detail.blocker.next_action) lines.push('', detail.blocker.next_action);
  }

  if (detail.evidence.length) {
    lines.push('', '## Evidence', '');
    for (const entry of detail.evidence) {
      lines.push(`- **${entry.kind}** \`${entry.ref}\`${entry.note ? ` — ${entry.note}` : ''}`);
    }
  }

  if (detail.standards?.length) {
    lines.push('', '## Standards cited', '');
    for (const citation of detail.standards) {
      lines.push(`- **${citation.slug}** (${citation.name}): ${citation.reason}`);
    }
  }

  lines.push('', '## Input', '', '```json', JSON.stringify(detail.input, null, 2), '```');
  if (detail.result.data) {
    lines.push('', '## Result data', '', '```json', JSON.stringify(detail.result.data, null, 2), '```');
  }

  return lines.join('\n');
}

export function previewContentFromReceiptDetail(
  detail: ReceiptDetail,
  artifact?: { body: string; ref: string } | null,
): PreviewContent | null {
  if (artifact?.body.trim()) {
    const fromArtifact = previewFromText(artifact.body, {
      title: `Receipt ${detail.id}`,
      sourceId: detail.id,
    });
    if (fromArtifact) return fromArtifact;
  }

  const markdown = receiptDetailToMarkdown(detail);
  return previewFromText(markdown, {
    title: `Receipt ${detail.id}`,
    sourceId: detail.id,
  });
}

export function previewContentFromInlineBody(body: string, title: string, sourceId: string): PreviewContent | null {
  return previewFromText(body, { title, sourceId });
}
