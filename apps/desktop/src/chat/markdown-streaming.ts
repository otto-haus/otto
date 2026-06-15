/**
 * Streaming markdown cost controls. Two independent mechanisms keep per-token work
 * bounded so a single long, actively-streaming message can never re-parse the whole
 * (growing) string each token and walk the renderer into a 4GB V8 OOM:
 *
 *  1. PRIMARY — block-level incremental parse. Finalized blocks (everything before
 *     the live tail boundary) are parsed once and cached; only the live tail block
 *     re-parses per token. Per-token cost is O(current block), not O(message).
 *  2. BACKSTOP — size-gated plain text. While streaming, if the live tail exceeds
 *     STREAMING_TAIL_MARKDOWN_MAX (or a single unbroken block exceeds
 *     STREAMING_PLAIN_TOTAL_MAX) we render it as cheap preformatted text and only
 *     run the full markdown parse when the block closes / the stream completes.
 */

/** Max live-tail chars to markdown-parse per streamed token; larger → plain pre. */
export const STREAMING_TAIL_MARKDOWN_MAX = 2048;

/** Single unbroken live block above this length renders plain while streaming. */
export const STREAMING_PLAIN_TOTAL_MAX = 4096;

/**
 * Index where the live (still-mutating) tail begins. The stable prefix ends at a
 * completed block boundary: the last blank-line separator, or the start of an
 * unclosed ``` fence. Text only ever appends during streaming, so this index is
 * monotonic — finalized content to its left is immutable and safe to cache.
 */
export function findStableMarkdownBoundary(text: string): number {
  let fenceCount = 0;
  let lastFenceOpen = 0;
  const fenceRe = /```/g;
  for (let m = fenceRe.exec(text); m; m = fenceRe.exec(text)) {
    fenceCount += 1;
    if (fenceCount % 2 === 1) lastFenceOpen = m.index;
  }
  // Odd number of fences → the last one is still open; tail starts at that fence.
  if (fenceCount % 2 === 1) return lastFenceOpen;

  const lastParaBreak = text.lastIndexOf('\n\n');
  if (lastParaBreak >= 0) return lastParaBreak + 2;

  return 0;
}

/** True when the live tail should be rendered as plain pre rather than markdown. */
export function shouldPlainRenderTail(boundary: number, totalLength: number, tailLength: number): boolean {
  // Pathological single unbroken block (no finalized prefix yet).
  if (boundary === 0 && totalLength > STREAMING_PLAIN_TOTAL_MAX) return true;
  // Otherwise gate purely on the live block's own size.
  return tailLength > STREAMING_TAIL_MARKDOWN_MAX;
}

/** Generate deterministic markdown-ish text with paragraph breaks for benchmarking. */
export function generateStreamingText(length: number, paragraphSize = 220): string {
  const out: string[] = [];
  let produced = 0;
  while (produced < length) {
    const remaining = length - produced;
    const size = Math.min(paragraphSize, remaining);
    const para = 'lorem ipsum dolor sit amet '.repeat(Math.ceil(size / 27)).slice(0, size);
    out.push(para);
    produced += size + 2; // account for the "\n\n" joiner
  }
  return out.join('\n\n').slice(0, length);
}

/**
 * Faithful proxy for markdown-parse work (≈ chars visited / nodes allocated) across
 * a full stream. Mirrors the runtime logic exactly:
 *  - 'naive'           : re-parse the entire growing string every token → O(n²).
 *  - 'incremental'     : parse each finalized char once + re-parse only the live
 *                        tail per token (PRIMARY) with the plain-text size guard
 *                        (BACKSTOP) zeroing markdown work for oversized tails.
 */
export function streamingParseWork(
  finalLength: number,
  tokenCount: number,
  mode: 'naive' | 'incremental',
  paragraphSize = 220,
): number {
  const full = generateStreamingText(finalLength, paragraphSize);
  const tokens = Math.max(1, tokenCount);
  const charsPerToken = Math.max(1, Math.ceil(full.length / tokens));

  let work = 0;
  let parsedUpTo = 0;
  for (let revealed = charsPerToken; ; revealed += charsPerToken) {
    const text = full.slice(0, Math.min(revealed, full.length));

    if (mode === 'naive') {
      work += text.length;
    } else {
      const boundary = findStableMarkdownBoundary(text);
      if (boundary > parsedUpTo) {
        // Each newly finalized char is parsed exactly once, ever.
        work += boundary - parsedUpTo;
        parsedUpTo = boundary;
      }
      const tailLength = text.length - boundary;
      if (!shouldPlainRenderTail(boundary, text.length, tailLength)) {
        work += tailLength; // re-parse only the small live tail
      }
      // else: plain pre — no markdown parse work for the tail this token
    }

    if (text.length >= full.length) break;
  }

  return work;
}
