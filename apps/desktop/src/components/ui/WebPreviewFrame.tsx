import React from 'react';
import { webPreviewEmpty } from '../../copy/surfaces';
import type { SurfaceId } from '../Sidebar';
import { EmptyState } from './EmptyState';

type PreviewSurface = Exclude<SurfaceId, 'chat' | 'settings'>;

export const WebPreviewFrame: React.FC<{ surface: PreviewSurface }> = ({ surface }) => {
  const copy = webPreviewEmpty[surface];
  return (
    <EmptyState
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      path={copy.path}
      next={copy.next}
    />
  );
};
