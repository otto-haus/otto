import { saveGeneratedArtifact, type GeneratedArtifact } from './artifact-store';
import { ReceiptWriter } from './receipt-writer';

export type ImageGenInput = {
  prompt: string;
  model?: string;
  /** Letta-owned provider key — never persisted by otto (#511). */
  apiKey?: string | null;
  fetchImpl?: typeof fetch;
};

export type ImageGenResult = {
  artifact: GeneratedArtifact;
  receiptPath: string;
};

const DEFAULT_MODEL = 'gpt-image-1';

/** Resolve OpenAI Images API key from Letta runtime env — not otto secrets. */
export function resolveImageGenApiKey(explicit?: string | null): string | null {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  const fromEnv = process.env.OPENAI_API_KEY?.trim();
  return fromEnv || null;
}

export async function generateImage(input: ImageGenInput): Promise<ImageGenResult> {
  const prompt = input.prompt?.trim();
  if (!prompt) throw new Error('Image prompt is required.');

  const model = input.model?.trim() || DEFAULT_MODEL;
  const apiKey = resolveImageGenApiKey(input.apiKey);
  if (!apiKey) {
    throw new Error('OpenAI provider key missing in Letta. Add a key in Letta settings — otto never stores provider keys.');
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const res = await fetchImpl('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Image generation failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const payload = await res.json() as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const row = payload.data?.[0];
  if (!row) throw new Error('Image generation returned no image data.');

  let imageBytes: Buffer;
  let mime = 'image/png';
  if (row.b64_json) {
    imageBytes = Buffer.from(row.b64_json, 'base64');
  } else if (row.url) {
    const imageRes = await fetchImpl(row.url);
    if (!imageRes.ok) throw new Error(`Could not download generated image (${imageRes.status}).`);
    mime = imageRes.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';
    imageBytes = Buffer.from(await imageRes.arrayBuffer());
  } else {
    throw new Error('Image generation returned unsupported response shape.');
  }

  const receipts = new ReceiptWriter();
  const receipt = receipts.write({
    status: 'success',
    subject: { type: 'run', id: 'image_gen' },
    action: 'labs.image_gen.generate',
    input: { prompt, model },
    result: {
      summary: 'Generated image saved as artifact — not ratified',
      data: { ratified: false },
    },
    evidence: [],
    blocker: null,
  });

  const artifact = saveGeneratedArtifact({
    imageBytes,
    mime,
    prompt,
    model,
    receiptPath: receipt.path,
  });

  return { artifact, receiptPath: receipt.path };
}
