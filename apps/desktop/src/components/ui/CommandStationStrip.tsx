import React from 'react';
import type { SurfaceId } from '../Sidebar';
import { commandStationCopy } from '../../copy/surfaces';

export type CommandStationCounts = Partial<{
  curationPending: number;
  recentReceipts: number;
  openTickets: number;
  autonomyDoors: number;
}>;

export type CultureHomeData = Partial<{
  constitutionHint: string;
  changelogHint: string;
  latestProofHint: string;
}>;

type DrillMeta = {
  settingsSection?: 'culture';
  curationPanel?: 'inbox' | 'changelog';
};

type CardDef = {
  id: SurfaceId;
  label: string;
  hint: string;
  countKey?: keyof CommandStationCounts;
  drill?: DrillMeta;
};

const CULTURE_CARDS: CardDef[] = [
  {
    id: 'settings',
    label: commandStationCopy.constitution.label,
    hint: commandStationCopy.constitution.hint,
    drill: { settingsSection: 'culture' },
  },
  {
    id: 'curation',
    label: commandStationCopy.changelog.label,
    hint: commandStationCopy.changelog.hint,
    drill: { curationPanel: 'changelog' },
  },
  {
    id: 'receipts',
    label: commandStationCopy.latestProof.label,
    hint: commandStationCopy.latestProof.hint,
  },
];

const OPS_CARDS: CardDef[] = [
  {
    id: 'curation',
    label: commandStationCopy.needsRatification.label,
    hint: commandStationCopy.needsRatification.hint,
    countKey: 'curationPending',
    drill: { curationPanel: 'inbox' },
  },
  {
    id: 'autonomy',
    label: commandStationCopy.autonomy.label,
    hint: commandStationCopy.autonomy.hint,
    countKey: 'autonomyDoors',
  },
  {
    id: 'tickets',
    label: commandStationCopy.tickets.label,
    hint: commandStationCopy.tickets.hint,
    countKey: 'openTickets',
  },
];

const CountOrDash: React.FC<{ value?: number }> = ({ value }) => (
  <span className="commandStation__count">{typeof value === 'number' ? value : '—'}</span>
);

const applyDrill = (drill?: DrillMeta) => {
  if (!drill) return;
  try {
    if (drill.settingsSection) {
      sessionStorage.setItem('otto.settings.section', drill.settingsSection);
    }
    if (drill.curationPanel) {
      sessionStorage.setItem('otto.curation.panel', drill.curationPanel);
    }
  } catch { /* best effort */ }
};

const cultureHintFor = (card: CardDef, culture?: CultureHomeData): string => {
  if (card.label === commandStationCopy.constitution.label) {
    return culture?.constitutionHint ?? card.hint;
  }
  if (card.label === commandStationCopy.changelog.label) {
    return culture?.changelogHint ?? card.hint;
  }
  if (card.label === commandStationCopy.latestProof.label) {
    return culture?.latestProofHint ?? card.hint;
  }
  return card.hint;
};

/** Thin command station strip — **059** / **127**. Culture row first; counts optional. */
export const CommandStationStrip: React.FC<{
  onNavigate: (id: SurfaceId) => void;
  counts?: CommandStationCounts;
  culture?: CultureHomeData;
  showCulture?: boolean;
}> = ({ onNavigate, counts, culture, showCulture = true }) => (
  <section className="commandStation" aria-label={commandStationCopy.title}>
    <div className="commandStation__head">
      <div className="eyebrow">{commandStationCopy.eyebrow}</div>
      <div className="commandStation__title">{commandStationCopy.title}</div>
    </div>
    {showCulture ? (
      <div className="commandStation__row">
        <div className="commandStation__rowLabel">{commandStationCopy.cultureRow}</div>
        <div className="commandStation__grid">
          {CULTURE_CARDS.map((card) => (
            <button
              key={`culture-${card.id}-${card.label}`}
              type="button"
              className="commandStation__card commandStation__card--culture"
              onClick={() => {
                applyDrill(card.drill);
                onNavigate(card.id);
              }}
            >
              <span className="commandStation__dash">→</span>
              <span className="commandStation__label">{card.label}</span>
              <span className="commandStation__hint">{cultureHintFor(card, culture)}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null}
    <div className="commandStation__row">
      <div className="commandStation__rowLabel">{commandStationCopy.opsRow}</div>
      <div className="commandStation__grid">
        {OPS_CARDS.map((card) => (
          <button
            key={`ops-${card.id}-${card.label}`}
            type="button"
            className="commandStation__card"
            onClick={() => {
              applyDrill(card.drill);
              onNavigate(card.id);
            }}
          >
            <CountOrDash value={card.countKey ? counts?.[card.countKey] : undefined} />
            <span className="commandStation__label">{card.label}</span>
            <span className="commandStation__hint">{card.hint}</span>
          </button>
        ))}
      </div>
    </div>
  </section>
);
