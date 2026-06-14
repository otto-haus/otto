import React from 'react';
import { EmptyState } from '../components/ui';
import { labsCopy } from '../copy/surfaces';
import type { SurfaceId } from '../components/Sidebar';
import { WORKSPACE_PREVIEW_SURFACES, isLabsTierSurface, surfaceLabel } from '../surface-tiers';
import { META } from '../surface-meta';

export const ComingSoonSurface: React.FC<{
  id: SurfaceId;
  onOpenLabs?: () => void;
}> = ({ id, onOpenLabs }) => {
  const meta = META[id];
  const label = meta?.title ?? surfaceLabel(id);
  const labsTier = isLabsTierSurface(id);
  const workspacePreview = WORKSPACE_PREVIEW_SURFACES.has(id);
  const blurb = meta?.sub ?? (!workspacePreview && labsTier ? labsCopy.comingSoonNext : labsCopy.comingSoonWorkspaceNext);
  const next = !workspacePreview && labsTier ? labsCopy.comingSoonNext : labsCopy.comingSoonWorkspaceNext;
  return (
    <div className="comingSoonShell" data-surface={id}>
      <EmptyState
        eyebrow={labsCopy.comingSoonEyebrow}
        title={labsCopy.comingSoonTitle(label)}
        body={blurb}
        next={next}
      />
      {onOpenLabs && labsTier ? (
        <div className="comingSoonShell__actions">
          <button type="button" className="btn btn--primary" onClick={onOpenLabs}>
            {labsCopy.openLabs}
          </button>
        </div>
      ) : null}
    </div>
  );
};
