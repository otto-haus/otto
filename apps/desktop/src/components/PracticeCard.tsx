import type { PracticeSpec } from '@vinny-os/core';

type PracticeCardProps = {
  practice: PracticeSpec;
  selected: boolean;
  onSelect: (practice: PracticeSpec) => void;
};

export function PracticeCard({ practice, selected, onSelect }: PracticeCardProps) {
  return (
    <button
      className={`practice-card ${selected ? 'is-selected' : ''}`}
      type="button"
      onClick={() => onSelect(practice)}
      aria-pressed={selected}
    >
      <span className="practice-card__header">
        <span>
          <span className="eyebrow">Practice</span>
          <strong>{practice.name}</strong>
        </span>
        <span className={`status-badge status-badge--${practice.status}`}>{practice.status}</span>
      </span>
      <span className="practice-card__summary">{practice.summary}</span>
      <span className="invocation-list" aria-label={`${practice.name} invocations`}>
        {practice.invocations.map((invocation) => (
          <code key={invocation}>{invocation}</code>
        ))}
      </span>
    </button>
  );
}
