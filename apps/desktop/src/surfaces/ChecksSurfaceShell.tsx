import React from 'react';
import { checksCopy, cultureCiCopy } from '../copy/surfaces';
import { InlineEmpty, SurfaceHeader, SurfacePage } from '../components/ui';

/** Checks pane shell — wire to checks.list IPC when builder **133** lands. Not routed in App yet. */
export const ChecksSurfaceShell: React.FC = () => (
  <SurfacePage>
    <SurfaceHeader eyebrow={checksCopy.eyebrow} title={checksCopy.title} lede={checksCopy.lede} />
    <p className="muted" style={{ margin: '0 0 12px' }}>{cultureCiCopy.blockHint}</p>
    <InlineEmpty title={checksCopy.emptyTitle} body={checksCopy.emptyBody} />
  </SurfacePage>
);
