import type { TurnTrail } from './turn-trail';

export type TurnTrailLiveProps = {
  trail: TurnTrail | null;
  fallbackLabel: string;
};

/** Compact live step list during streaming — latest step emphasized. */
export function TurnTrailLive({ trail, fallbackLabel }: TurnTrailLiveProps) {
  const spans = trail?.spans ?? [];
  if (spans.length === 0) {
    return <span>{fallbackLabel}</span>;
  }

  return (
    <ol className="turnTrailLive" aria-live="polite" aria-label="Agent turn steps">
      {spans.map((span, index) => {
        const isLatest = index === spans.length - 1;
        return (
          <li
            key={span.id}
            className={`turnTrailLive__step${isLatest ? ' turnTrailLive__step--latest' : ''}${span.status === 'running' ? ' turnTrailLive__step--running' : ''}`}
          >
            {span.label}
          </li>
        );
      })}
    </ol>
  );
}
