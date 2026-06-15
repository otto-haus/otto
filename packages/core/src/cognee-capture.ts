/**
 * Cognee canon capture — allowlist, provenance, and idempotency helpers (043).
 * Pure functions only; filesystem I/O lives in scripts/cognee-capture-run.ts.
 */

export const CAPTURE_KINDS = ['receipt', 'charter', 'ticket', 'standard', 'precedent', 'manual'] as const;
export type CaptureKind = (typeof CAPTURE_KINDS)[number];

export type CaptureProvenanceEntry = {
  source_kind: CaptureKind;
  repo_path: string;
  content_hash: string;
  captured_at: string;
  otto_ticket_id?: string;
  git_commit?: string;
};

export type CaptureReceiptProvenance = {
  kinds: string;
  since: string;
  git_commit: string;
  ingestMode: 'stub' | 'cli';
  skipped_count?: number;
  smoke?: boolean;
};

export type CogneeCaptureReceiptV1 = {
  id: string;
  capturedAt: string;
  sourceKind: 'manual';
  paths: string[];
  entries: CaptureProvenanceEntry[];
  docCount: number;
  entityCount: number | null;
  provenance: CaptureReceiptProvenance;
};

const KIND_ROOTS: Record<Exclude<CaptureKind, 'manual'>, string[]> = {
  receipt: ['receipts'],
  precedent: ['standards/precedents'],
  standard: ['standards'],
  ticket: ['planning/hq-tickets/_Done'],
  charter: ['charters'],
};

export function isForbiddenCapturePath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.includes('.env') ||
    normalized.includes('/secrets/') ||
    normalized.startsWith('secrets/') ||
    normalized.includes('/node_modules/')
  );
}

export function toRepoRelativePath(absPath: string, root: string): string {
  const normRoot = root.replace(/\\/g, '/').replace(/\/$/, '');
  const normPath = absPath.replace(/\\/g, '/');
  if (normPath.startsWith(`${normRoot}/`)) return normPath.slice(normRoot.length + 1);
  return normPath;
}

export function classifyCaptureSourceKind(repoRelativePath: string): CaptureKind {
  const rel = repoRelativePath.replace(/\\/g, '/');
  if (rel.startsWith('receipts/') && !rel.startsWith('receipts/cognee/')) return 'receipt';
  if (rel.startsWith('standards/precedents/')) return 'precedent';
  if (rel.startsWith('standards/')) return 'standard';
  if (rel.startsWith('planning/hq-tickets/_Done/')) return 'ticket';
  if (rel.startsWith('charters/')) return 'charter';
  return 'manual';
}

export function filterAllowedCapturePaths(paths: string[]): string[] {
  return paths.filter((p) => !isForbiddenCapturePath(p));
}

export function pathMatchesCaptureKind(repoRelativePath: string, kind: CaptureKind): boolean {
  if (kind === 'manual') return true;
  const rel = repoRelativePath.replace(/\\/g, '/');
  if (kind === 'receipt') {
    return rel.startsWith('receipts/') && !rel.startsWith('receipts/cognee/');
  }
  const roots = KIND_ROOTS[kind];
  return roots.some((root) => rel.startsWith(`${root}/`) || rel === root);
}

export function selectSmokeCapturePaths(absPaths: string[], root: string): string[] {
  const receipts: string[] = [];
  const precedents: string[] = [];
  for (const abs of absPaths) {
    const kind = classifyCaptureSourceKind(toRepoRelativePath(abs, root));
    if (kind === 'receipt') receipts.push(abs);
    if (kind === 'precedent') precedents.push(abs);
  }
  return [...receipts.slice(0, 3), ...precedents.slice(0, 1)];
}

export function buildCaptureProvenanceEntry(
  absPath: string,
  root: string,
  capturedAt: string,
  gitCommit: string,
): CaptureProvenanceEntry {
  const repoPath = toRepoRelativePath(absPath, root);
  return {
    source_kind: classifyCaptureSourceKind(repoPath),
    repo_path: repoPath,
    content_hash: '',
    captured_at: capturedAt,
    git_commit: gitCommit,
  };
}

/** Skip paths whose repo_path + content_hash already appear in prior capture entries. */
export function dedupeAgainstPriorCaptures(
  entries: Array<{ absPath: string; content_hash: string; repo_path: string }>,
  priorHashes: Map<string, string>,
): { toIngest: typeof entries; skipped: string[] } {
  const toIngest: typeof entries = [];
  const skipped: string[] = [];
  for (const entry of entries) {
    const prior = priorHashes.get(entry.repo_path);
    if (prior && prior === entry.content_hash) {
      skipped.push(entry.repo_path);
      continue;
    }
    toIngest.push(entry);
  }
  return { toIngest, skipped };
}

export function loadPriorContentHashes(
  receipts: Array<{ entries?: CaptureProvenanceEntry[]; paths?: string[] }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const receipt of receipts) {
    if (receipt.entries?.length) {
      for (const entry of receipt.entries) {
        if (entry.repo_path && entry.content_hash) {
          map.set(entry.repo_path, entry.content_hash);
        }
      }
    }
  }
  return map;
}

export function recallSpotCheckFromReceipt(
  receipt: Pick<CogneeCaptureReceiptV1, 'paths' | 'entries'>,
  query = 'receipt precedent',
): { ok: boolean; citations: Array<{ path: string; snippet: string }>; error: string | null } {
  const repoPaths =
    receipt.entries?.map((e) => e.repo_path).filter(Boolean) ??
    receipt.paths.map((p) => p.replace(/\\/g, '/'));
  const receiptPaths = repoPaths.filter((p) => p.includes('receipts/') && !p.includes('receipts/cognee/'));
  if (receiptPaths.length === 0) {
    return { ok: false, citations: [], error: 'No receipts/ paths in capture receipt' };
  }
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const ranked = receiptPaths
    .map((path) => {
      const lower = path.toLowerCase();
      const score = terms.reduce((n, t) => (lower.includes(t) ? n + 1 : n), 0);
      return { path, score };
    })
    .sort((a, b) => b.score - a.score);
  const pick = ranked.find((r) => r.score > 0) ?? ranked[0]!;
  return {
    ok: true,
    citations: [{ path: pick.path, snippet: `Capture receipt cites ${pick.path}` }],
    error: null,
  };
}
