import { describe, expect, test } from 'bun:test';
import {
  defaultPreviewCorrectionDraft,
  previewArtifactHash,
  serializePreviewElementContext,
} from './preview-element-context';

const samplePick = {
  tag: 'button',
  id: 'submit',
  classes: ['primary', 'cta'],
  textSnippet: '  Save   changes  ',
  bounds: { x: 12, y: 40, w: 120, h: 32 },
};

describe('previewArtifactHash', () => {
  test('returns stable short hash for same body', () => {
    const a = previewArtifactHash('<p>Hi</p>');
    const b = previewArtifactHash('<p>Hi</p>');
    expect(a).toBe(b);
    expect(a).toMatch(/^pv[0-9a-f]{12}$/);
  });

  test('differs for different bodies', () => {
    expect(previewArtifactHash('<p>a</p>')).not.toBe(previewArtifactHash('<p>b</p>'));
  });
});

describe('serializePreviewElementContext', () => {
  test('formats human-readable preview-origin context without raw DOM', () => {
    const text = serializePreviewElementContext({
      sourceMessageId: 'msg-42',
      artifactHash: 'pvabc123',
      pick: samplePick,
    });
    expect(text).toContain('Preview-origin correction');
    expect(text).toContain('Source message: msg-42');
    expect(text).toContain('Artifact: pvabc123');
    expect(text).toContain('Element: button#submit.primary.cta');
    expect(text).toContain('Region: 120×32px at (12, 40)');
    expect(text).toContain('Text: "Save changes"');
    expect(text).not.toContain('<button');
  });
});

describe('defaultPreviewCorrectionDraft', () => {
  test('suggests future behavior from selector and snippet', () => {
    const draft = defaultPreviewCorrectionDraft(samplePick);
    expect(draft).toContain('button#submit.primary.cta');
    expect(draft).toContain('Save changes');
  });
});
