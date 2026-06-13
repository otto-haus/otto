import { createWriteStream, mkdirSync, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { OTTO_DIR } from './config-store';

export const RUNS_DIR = join(OTTO_DIR, 'runs');

/** One JSONL trace per turn at ~/.otto/runs/<timestamp>-<conversation>.jsonl — Otto's observability seed. */
export class TraceWriter {
  readonly path: string;
  private stream: WriteStream;

  constructor(conversation: string) {
    mkdirSync(RUNS_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const conv = (conversation || 'new').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'new';
    this.path = join(RUNS_DIR, `${ts}-${conv}.jsonl`);
    this.stream = createWriteStream(this.path, { flags: 'a' });
  }

  write(kind: string, data: unknown) {
    this.stream.write(`${JSON.stringify({ t: Date.now(), kind, data })}\n`);
  }

  close() {
    this.stream.end();
  }
}
