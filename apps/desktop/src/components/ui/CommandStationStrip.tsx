import React from 'react';
import type { SurfaceId } from '../Sidebar';
import { commandStationCopy } from '../../copy/surfaces';

export type CommandStationCounts = Partial<{
  curationPending: number;
  recentReceipts: number;
  openTickets: number;
  autonomyDoors: number;
}>;

type CardDef = {
  id: SurfaceId;
  label: string;
  hint: string;
  countKey?: keyof CommandStationCounts;
};

const OPS_CARDS: CardDef[] = [
  { id: 'curation', label: commandStationCopy.curation.label, hint: commandStationCopy.curation.hint, countKey: 'curationPending' },
  { id: 'receipts', label: commandStationCopy.receipts.label, hint: commandStationCopy.receipts.hint, countKey: 'recentReceipts' },
  { id: 'tickets', label: commandStationCopy.tickets.label, hint: commandStationCopy.tickets.hint, countKey: 'openTickets' },
  { id: 'autonomy', label: commandStationCopy.autonomy.label, hint: commandStationCopy.autonomy.hint, countKey: 'autonomyDoors' },
];

const CULTURE_CARDS: CardDef[] = [
  { id: 'standards', label: commandStationCopy.constitution.label, hint: commandStationCopy.constitution.hint },
  { id: 'curation', label: commandStationCopy.changelog.label, hint: commandStationCopy.changelog.hint },
];

const CountOrDash: React.FC<{ value?: number }> = ({ value }) => (
  <span className="commandStation__count">{typeof value === 'number' ? value : '—'}</span>
);

/** Thin command station strip — **059** / **127**. Counts optional; never fabricates when omitted. */
export const CommandStationStrip: React.FC<{
  onNavigate: (id: SurfaceId) => void;
  counts?: CommandStationCounts;
  showCulture?: boolean;
}> = ({ onNavigate, counts, showCulture = true }) => (
  <section className="commandStation" aria-label={commandStationCopy.title}>
    <div className="commandStation__head">
      <div className="eyebrow">{commandStationCopy.eyebrow}</div>
      <div className="commandStation__title">{commandStationCopy.title}</div>
    </div>
    <div className="commandStation__grid">
      {OPS_CARDS.map((card) => (
        <button
          key={`ops-${card.id}-${card.label}`}
          type="button"
          className="commandStation__card"
          onClick={() => onNavigate(card.id)}
        >
          <CountOrDash value={card.countKey ? counts?.[card.countKey] : undefined} />
          <span className="commandStation__label">{card.label}</span>
          <span className="commandStation__hint">{card.hint}</span>
        </button>
      ))}
      {showCulture
        ? CULTURE_CARDS.map((card) => (
            <button
              key={`culture-${card.id}-${card.label}`}
              type="button"
              className="commandStation__card commandStation__card--culture"
              onClick={() => onNavigate(card.id)}
            >
              <span className="commandStation__dash">→</span>
              <span className="commandStation__label">{card.label}</span>
              <span className="commandStation__hint">{card.hint}</span>
            </button>
          ))
        : null}
    </div>
  </section>
);
