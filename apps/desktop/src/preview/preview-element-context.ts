/** Serializable element pick from sandboxed HTML preview (annotate mode). */
export type PreviewElementBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PreviewElementPick = {
  tag: string;
  id: string | null;
  classes: string[];
  textSnippet: string;
  bounds: PreviewElementBounds;
};

export type PreviewCorrectionSeed = {
  sourceMessageId: string;
  artifactHash: string;
  pick: PreviewElementPick;
};

const HASH_PREFIX_LEN = 12;

/** Stable short hash for linking preview artifact to a correction proposal. */
export function previewArtifactHash(body: string): string {
  let hash = 5381;
  for (let i = 0; i < body.length; i += 1) {
    hash = ((hash << 5) + hash) ^ body.charCodeAt(i);
  }
  return `pv${(hash >>> 0).toString(16).padStart(HASH_PREFIX_LEN, '0').slice(0, HASH_PREFIX_LEN)}`;
}

function formatSelector(pick: PreviewElementPick): string {
  let selector = pick.tag;
  if (pick.id) selector += `#${pick.id}`;
  if (pick.classes.length) selector += `.${pick.classes.slice(0, 4).join('.')}`;
  return selector;
}

function formatBounds(bounds: PreviewElementBounds): string {
  return `${bounds.w}×${bounds.h}px at (${bounds.x}, ${bounds.y})`;
}

/** Human-readable context for Propose Correction — not a raw DOM dump. */
export function serializePreviewElementContext(seed: PreviewCorrectionSeed): string {
  const { pick, sourceMessageId, artifactHash } = seed;
  const lines = [
    'Preview-origin correction',
    `Source message: ${sourceMessageId}`,
    `Artifact: ${artifactHash}`,
    `Element: ${formatSelector(pick)}`,
    `Region: ${formatBounds(pick.bounds)}`,
  ];
  if (pick.textSnippet) {
    lines.push(`Text: "${pick.textSnippet.replace(/\s+/g, ' ').trim()}"`);
  }
  return lines.join('\n');
}

export function defaultPreviewCorrectionDraft(pick: PreviewElementPick): string {
  const target = formatSelector(pick);
  const snippet = pick.textSnippet.replace(/\s+/g, ' ').trim();
  if (snippet) {
    return `When rendering ${target}, change how "${snippet.slice(0, 80)}" appears or behaves.`;
  }
  return `When rendering ${target}, describe the visual or behavioral change you want.`;
}
