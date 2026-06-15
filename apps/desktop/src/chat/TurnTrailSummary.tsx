import { useId, useState } from 'react';
import type { TurnTrail } from './turn-trail';
import {
  collapsedTrailSummary,
  deriveTurnPhases,
  formatPhaseStrip,
  formatTrailDuration,
} from './turn-trail';

export type TurnTrailSummaryProps = {
  trail: TurnTrail;
  showPhases?: boolean;
};

export function turnTrailSummaryLines(trail: TurnTrail, showPhases = false): {
  collapsed: string;
  phases: string;
  expanded: string[];
} {
  const collapsed = collapsedTrailSummary(trail);
  const phases = showPhases ? deriveTurnPhases(trail) : [];
  const phaseStrip = phases.length ? formatPhaseStrip(phases) : '';
  const expanded = trail.spans.map((span) => {
    const duration = span.durationMs ? formatTrailDuration(span.durationMs) : '';
    return duration ? `${span.label} (${duration})` : span.label;
  });
  return { collapsed, phases: phaseStrip, expanded };
}

/** Collapsed play-by-play chip on completed assistant messages. */
export function TurnTrailSummary({ trail, showPhases = false }: TurnTrailSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  if (!trail.spans.length) return null;

  const { collapsed, phases, expanded: lines } = turnTrailSummaryLines(trail, showPhases);
  if (!collapsed) return null;

  const header = showPhases && phases ? `${phases} · ${collapsed.split(' · ').pop()}` : collapsed;

  return (
    <div className="turnTrailSummary">
      <button
        type="button"
        className="turnTrailSummary__toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
      >
        {header}
      </button>
      {expanded ? (
        <ol id={panelId} className="turnTrailSummary__list">
          {lines.map((line, index) => (
            <li key={`${trail.spans[index]?.id ?? index}`}>{line}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
