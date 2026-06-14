import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const WS_PROMOTION_GATE_REASON =
  'WS promotion scorecard not passed — auto uses SDK until reviewer-approved traces land (039).';

type ScorecardFile = {
  promotionApproved?: boolean;
  dimensions?: Array<{ status?: string }>;
};

/** True only when explicit env or filled scorecard approves WS promotion (039 gate). */
export function wsPromotionApproved(): boolean {
  const env = process.env.OTTO_WS_PROMOTION_APPROVED?.trim().toLowerCase();
  if (env === '1' || env === 'true' || env === 'yes') return true;
  if (env === '0' || env === 'false' || env === 'no') return false;

  for (const path of scorecardPaths()) {
    if (!existsSync(path)) continue;
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as ScorecardFile;
      if (data.promotionApproved === true) return true;
      const dims = data.dimensions ?? [];
      if (dims.length > 0 && dims.every((d) => d.status === 'pass')) return true;
    } catch {
      // ignore malformed scorecard
    }
  }
  return false;
}

function scorecardPaths(): string[] {
  const root = process.env.OTTO_ROOT?.trim() ? resolve(process.env.OTTO_ROOT) : resolve(process.cwd());
  return [
    join(root, 'docs/receipts/staging/039-scorecard-template.json'),
    join(root, 'docs/receipts/staging/039-ws-promotion-scorecard.json'),
  ];
}
