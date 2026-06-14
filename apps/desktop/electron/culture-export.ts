import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { CultureExportManifest, CultureExportResult, CultureImportPreview } from '@otto-haus/core';
import { OTTO_DIR } from './config-store';
import { ConstitutionStore } from './constitution-store';
import { PracticeStore } from './practice-store';
import { ReceiptWriter } from './receipt-writer';
import { ReceiptStore } from './receipt-store';
import { RoutineStore } from './routine-store';
import { StandardStore } from './standard-store';

const SECRET_PATTERN = /\b(api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/i;

export class CultureExporter {
  private readonly constitutionYaml: string;
  private readonly constitutionMd: string;

  constructor(
    private ottoDir = OTTO_DIR,
    private constitution = new ConstitutionStore(
      join(ottoDir, 'constitution.yaml'),
      join(ottoDir, 'constitution.md'),
    ),
    private receipts = new ReceiptStore(),
    private receiptWriter = new ReceiptWriter(),
  ) {
    this.constitutionYaml = join(this.ottoDir, 'constitution.yaml');
    this.constitutionMd = join(this.ottoDir, 'constitution.md');
  }

  exportBundle(): CultureExportResult {
    mkdirSync(this.ottoDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bundleName = `otto-culture-export-${stamp}`;
    const stagingDir = join(this.ottoDir, 'exports', bundleName);
    mkdirSync(stagingDir, { recursive: true });

    const includes: string[] = [];
    const copyIfExists = (src: string, destRel: string) => {
      if (!existsSync(src)) return;
      const dest = join(stagingDir, destRel);
      mkdirSync(join(dest, '..'), { recursive: true });
      cpSync(src, dest, { recursive: statSync(src).isDirectory() });
      includes.push(destRel);
    };

    this.constitution.load();
    copyIfExists(this.constitutionYaml, 'constitution.yaml');
    copyIfExists(this.constitutionMd, 'constitution.md');
    copyIfExists(join(this.ottoDir, 'autonomy'), 'autonomy');

    const standardDir = new StandardStore().listResult().dir;
    const practiceDir = new PracticeStore().listResult().dir;
    const routineDir = new RoutineStore().listResult().dir;
    copyIfExists(standardDir, 'canon/standards');
    copyIfExists(practiceDir, 'canon/practices');
    copyIfExists(routineDir, 'canon/routines');

    const receiptIndex = this.receipts.list().receipts.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      status: r.status,
      subjectType: r.subjectType,
      summary: r.summary,
    }));
    writeFileSync(join(stagingDir, 'receipt-index.json'), `${JSON.stringify(receiptIndex, null, 2)}\n`);
    includes.push('receipt-index.json');

    const manifest: CultureExportManifest = {
      schema: 'otto.culture-export.v1',
      exported_at: new Date().toISOString(),
      workspace: this.ottoDir,
      includes,
      excludes: ['letta memory blocks', 'api keys', 'chat transcripts', 'provider secrets'],
      receipt_index_count: receiptIndex.length,
      constitution_hash: this.constitution.hash(),
    };
    writeFileSync(join(stagingDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

    this.assertNoSecretsInDir(stagingDir);

    const zipPath = `${stagingDir}.zip`;
    try {
      execFileSync('zip', ['-r', zipPath, '.'], { cwd: stagingDir, stdio: 'pipe' });
    } catch {
      // Fallback: bundle directory without zip when zip CLI unavailable.
    }
    const bundlePath = existsSync(zipPath) ? zipPath : stagingDir;

    const receipt = this.receiptWriter.write({
      status: 'success',
      subject: { type: 'constitution', id: 'culture-export' },
      action: 'culture.export',
      input: { bundle: basename(bundlePath) },
      result: {
        summary: `Culture bundle exported (${manifest.receipt_index_count} receipt index entries)`,
        data: { bundlePath, manifest },
      },
      evidence: [{ kind: 'file', ref: bundlePath }],
      blocker: null,
    });

    return { bundlePath, manifest, receipt };
  }

  previewImport(bundlePath: string): CultureImportPreview {
    const manifestPath = join(bundlePath, 'manifest.json');
    if (!existsSync(manifestPath)) {
      return {
        valid: false,
        manifest: null,
        diff: [],
        blocked_reason: 'manifest.json not found — dry-run only; apply requires Curation.',
      };
    }
    let manifest: CultureExportManifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as CultureExportManifest;
    } catch {
      return { valid: false, manifest: null, diff: [], blocked_reason: 'manifest.json is malformed' };
    }
    if (manifest.schema !== 'otto.culture-export.v1') {
      return { valid: false, manifest, diff: [], blocked_reason: 'Unsupported manifest schema' };
    }

    try {
      this.assertNoSecretsInDir(bundlePath);
    } catch (e) {
      return {
        valid: false,
        manifest,
        diff: [],
        blocked_reason: e instanceof Error ? e.message : String(e),
      };
    }

    const diff = (manifest.includes ?? []).map((rel) => {
      const dest = rel.startsWith('constitution')
        ? join(this.ottoDir, basename(rel))
        : join(this.ottoDir, rel);
      const exists = existsSync(dest);
      return {
        path: rel,
        action: exists ? ('update' as const) : ('add' as const),
        note: exists ? 'Would update existing file' : 'Would add new file',
      };
    });

    return {
      valid: true,
      manifest,
      diff,
    };
  }

  private assertNoSecretsInDir(dir: string): void {
    for (const entry of walk(dir)) {
      if (!entry.endsWith('.json') && !entry.endsWith('.yaml') && !entry.endsWith('.yml') && !entry.endsWith('.md')) {
        continue;
      }
      const text = readFileSync(entry, 'utf8');
      if (SECRET_PATTERN.test(text)) {
        throw new Error(`Possible secret in bundle file: ${basename(entry)}`);
      }
    }
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}