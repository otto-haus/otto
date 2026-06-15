#!/usr/bin/env bun
/**
 * Cognee canon capture runner (043) — dry-run, apply, provenance receipts.
 * Invoked by scripts/cognee-capture.sh
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildCaptureProvenanceEntry,
  dedupeAgainstPriorCaptures,
  filterAllowedCapturePaths,
  loadPriorContentHashes,
  pathMatchesCaptureKind,
  recallSpotCheckFromReceipt,
  selectSmokeCapturePaths,
  toRepoRelativePath,
  type CaptureKind,
  type CogneeCaptureReceiptV1,
} from '../packages/core/src/cognee-capture.js';

type Args = {
  kinds: CaptureKind[];
  dryRun: boolean;
  apply: boolean;
  since: string;
  smoke: boolean;
};

function sha256FileContent(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    kinds: ['receipt', 'precedent'],
    dryRun: false,
    apply: false,
    since: '',
    smoke: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--kinds') {
      args.kinds = `${argv[++i] ?? ''}`.split(',').filter(Boolean) as CaptureKind[];
    } else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--since') args.since = argv[++i] ?? '';
    else if (arg === '--smoke') args.smoke = true;
    else throw new Error(`Unknown arg: ${arg}`);
  }
  return args;
}

function collectPaths(root: string, kinds: CaptureKind[]): string[] {
  const exts = new Set(['.md', '.json']);
  const paths: string[] = [];

  function walk(dir: string): void {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'cognee' && dir.endsWith('/receipts')) continue;
        walk(full);
        continue;
      }
      const ext = entry.name.includes('.') ? `.${entry.name.split('.').pop()}` : '';
      if (!exts.has(ext)) continue;
      paths.push(full);
    }
  }

  for (const kind of kinds) {
    if (kind === 'receipt') walk(join(root, 'receipts'));
    else if (kind === 'precedent') walk(join(root, 'standards/precedents'));
    else if (kind === 'standard') walk(join(root, 'standards'));
    else if (kind === 'ticket') walk(join(root, 'planning/hq-tickets/_Done'));
    else if (kind === 'charter') walk(join(root, 'charters'));
  }

  const unique = [...new Set(paths)];
  return filterAllowedCapturePaths(unique).filter((abs) => {
    const rel = toRepoRelativePath(abs, root);
    return kinds.some((kind) => pathMatchesCaptureKind(rel, kind));
  });
}

function gitShortCommit(root: string): string {
  const result = spawnSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
  return result.stdout?.trim() || 'unknown';
}

function resolveCogneeCli(): string | null {
  const candidates = [
    process.env.COGNEE_CLI_PATH,
    'cognee-cli',
    'cognee',
    join(process.env.HOME ?? '', '.otto/cognee/venv/bin/cognee-cli'),
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (candidate.includes('/')) {
      if (existsSync(candidate)) return candidate;
      continue;
    }
    const result = spawnSync('command', ['-v', candidate], { shell: true, encoding: 'utf8' });
    const path = result.stdout?.trim();
    if (path) return path;
  }
  return null;
}

function loadPriorReceipts(captureDir: string): CogneeCaptureReceiptV1[] {
  if (!existsSync(captureDir)) return [];
  return readdirSync(captureDir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => {
      try {
        return JSON.parse(readFileSync(join(captureDir, file), 'utf8')) as CogneeCaptureReceiptV1;
      } catch {
        return null;
      }
    })
    .filter((r): r is CogneeCaptureReceiptV1 => !!r);
}

function ingestPaths(cli: string, paths: string[]): void {
  for (const p of paths) {
    spawnSync(cli, ['add', p], { encoding: 'utf8', stdio: 'inherit' });
  }
  spawnSync(cli, ['cognify'], { encoding: 'utf8', stdio: 'inherit' });
}

function main(): void {
  const root = resolve(import.meta.dir, '..');
  const args = parseArgs(process.argv.slice(2));
  let paths = collectPaths(root, args.kinds);

  if (args.smoke) {
    paths = selectSmokeCapturePaths(paths, root);
  }

  if (args.dryRun) {
    for (const p of paths) console.log(`PATH ${p}`);
    console.log(`COUNT ${paths.length}`);
    return;
  }

  if (!args.apply) {
    console.error('Pass --apply to ingest (dry-run only)');
    process.exit(1);
  }

  const captureDir = join(root, 'receipts/cognee/capture');
  mkdirSync(captureDir, { recursive: true });

  const capturedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const gitCommit = gitShortCommit(root);
  const priorHashes = loadPriorContentHashes(loadPriorReceipts(captureDir));

  const staged = paths.map((absPath) => {
    const content = readFileSync(absPath);
    const repoPath = toRepoRelativePath(absPath, root);
    return {
      absPath,
      repo_path: repoPath,
      content_hash: sha256FileContent(content),
    };
  });

  const { toIngest, skipped } = dedupeAgainstPriorCaptures(staged, priorHashes);

  const entries = toIngest.map(({ absPath, content_hash }) => {
    const entry = buildCaptureProvenanceEntry(absPath, root, capturedAt, gitCommit);
    entry.content_hash = content_hash;
    return entry;
  });

  const cli = resolveCogneeCli();
  const ingestMode = cli ? 'cli' : 'stub';
  if (cli && toIngest.length > 0) {
    ingestPaths(cli, toIngest.map((e) => e.absPath));
  }

  const id = `capture-${capturedAt.replace(/-/g, '').replace(/:/g, '')}`;
  const receipt: CogneeCaptureReceiptV1 = {
    id,
    capturedAt,
    sourceKind: 'manual',
    paths: toIngest.map((e) => e.absPath),
    entries,
    docCount: toIngest.length,
    entityCount: null,
    provenance: {
      kinds: args.kinds.join(','),
      since: args.since,
      git_commit: gitCommit,
      ingestMode,
      skipped_count: skipped.length,
      smoke: args.smoke || undefined,
    },
  };

  const receiptPath = join(captureDir, `${id}.json`);
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${receiptPath} (${receipt.docCount} paths, ${skipped.length} skipped)`);

  const recall = recallSpotCheckFromReceipt(receipt);
  if (recall.ok) {
    console.log(`RECALL_OK ${recall.citations[0]?.path}`);
  } else {
    console.error(`RECALL_FAIL ${recall.error}`);
    process.exit(1);
  }
}

main();
