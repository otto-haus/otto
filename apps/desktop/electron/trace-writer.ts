import { createWriteStream, mkdirSync, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { defaultOttoDir } from './config-store';

export const runsDir = () => join(defaultOttoDir(), 'runs');

/** One JSONL trace per turn at ~/.otto/runs/<timestamp>-<conversation>.jsonl — Otto's observability seed. */
export class TraceWriter {
  readonly path: string;
  private stream: WriteStream;
  private closed = false;

  constructor(conversation: string) {
    const RUNS_DIR = runsDir();
    mkdirSync(RUNS_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const conv = (conversation || 'new').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'new';
    this.path = join(RUNS_DIR, `${ts}-${conv}.jsonl`);
    this.stream = createWriteStream(this.path, { flags: 'a' });
  }

  write(kind: string, data: unknown) {
    // A lingering turn handler may emit a late frame after the turn's trace is
    // closed; drop those writes instead of throwing ERR_STREAM_WRITE_AFTER_END.
    if (this.closed) return;
    this.stream.write(`${JSON.stringify({ t: Date.now(), kind, data })}\n`);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.stream.end();
  }
}
