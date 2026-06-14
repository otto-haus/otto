import React from 'react';
import { SURFACE_TESTS } from '../../canon-briefs';
import type { SurfaceId } from '../Sidebar';

export const SurfaceProof: React.FC<{ surface: SurfaceId }> = ({ surface }) => {
  const test = SURFACE_TESTS[surface];
  if (!test) return null;
  return (
    <p className="surfaceProof">
      <strong>The test:</strong> {test}
    </p>
  );
};
