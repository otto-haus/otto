import type { PracticeSpec } from '@otto-do/core';
import { PracticeCard } from './PracticeCard.js';

type PracticeListProps = {
  practices: PracticeSpec[];
  selectedSlug: PracticeSpec['slug'];
  onSelect: (practice: PracticeSpec) => void;
};

export function PracticeList({ practices, selectedSlug, onSelect }: PracticeListProps) {
  return (
    <section className="panel practice-list" aria-labelledby="practice-list-title">
      <div className="panel__heading">
        <p className="eyebrow">Files = truth</p>
        <h2 id="practice-list-title">Practices</h2>
      </div>
      <div className="practice-list__items">
        {practices.map((practice) => (
          <PracticeCard
            key={practice.slug}
            practice={practice}
            selected={practice.slug === selectedSlug}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
