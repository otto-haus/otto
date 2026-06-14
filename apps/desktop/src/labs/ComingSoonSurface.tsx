import React from 'react';
import { EmptyState } from '../components/ui';
import { labsCopy } from '../copy/surfaces';
import type { SurfaceId } from '../components/Sidebar';
import { surfaceLabel } from '../surface-tiers';
import { META } from '../surface-meta';

export const ComingSoonSurface: React.FC<{
  id: SurfaceId;
  onOpenLabs?: () => void;
}> = ({ id, onOpenLabs }) => {
  const meta = META[id];
  const label = meta?.title ?? surfaceLabel(id);
  const blurb = meta?.sub ?? labsCopy.comingSoonNext;
  return (
    <div className="comingSoonShell">
      <EmptyState
        eyebrow={labsCopy.comingSoonEyebrow}
        title={labsCopy.comingSoonTitle(label)}
        body={blurb}
        next={labsCopy.comingSoonNext}
      />
      {onOpenLabs ? (
        <div className="comingSoonShell__actions">
          <button type="button" className="btn btn--primary" onClick={onOpenLabs}>
            {labsCopy.openLabs}
          </button>
        </div>
      ) : null}
    </div>
  );
};
