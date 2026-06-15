import React from 'react';
import { EmptyState } from '../components/ui';
import { labsCopy } from '../copy/surfaces';
import type { SurfaceId } from '../components/Sidebar';
import { surfaceLabel } from '../surface-tiers';
import { META } from '../surface-meta';

export const ComingSoonSurface: React.FC<{
  id: SurfaceId;
}> = ({ id }) => {
  const meta = META[id];
  const label = meta?.title ?? surfaceLabel(id);
  const blurb = meta?.sub ?? labsCopy.comingSoonWorkspaceNext;
  const next = labsCopy.comingSoonWorkspaceNext;
  return (
    <div className="comingSoonShell" data-surface={id}>
      <EmptyState
        eyebrow={labsCopy.comingSoonEyebrow}
        title={labsCopy.comingSoonTitle(label)}
        body={blurb}
        next={next}
      />
    </div>
  );
};
