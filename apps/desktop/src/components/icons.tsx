import type React from 'react';
import { iconArt, type IconArtKey } from './icon-art';

const S: React.FC<{ children: React.ReactNode; w?: number }> = ({ children, w = 1.8 }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const Art: React.FC<{ name: IconArtKey }> = ({ name }) => {
  const art = iconArt[name];
  return (
    <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <g transform={art.transform}>
        {art.paths.map((p) => (
          <path key={p.d.slice(0, 24)} d={p.d} />
        ))}
      </g>
    </svg>
  );
};

export const Icon = {
  plus: <Art name="plus" />,
  panel: <Art name="panel" />,
  chat: <Art name="chat" />,
  charter: <Art name="charter" />,
  standards: <Art name="standards" />,
  practices: <Art name="practices" />,
  routines: <Art name="routines" />,
  curation: <Art name="curation" />,
  receipts: <Art name="receipts" />,
  autonomy: <Art name="autonomy" />,
  settings: <Art name="settings" />,
  send: <Art name="send" />,
  owl: <Art name="owl" />,
  theme: <Art name="theme" />,
  image: <S><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 15l-5-5-11 11" /></S>,
  pin: <S><path d="m14.5 4.5 5 5-3.1 1.1-3.2 3.2-.6 4.7-2.9-2.9-4.2 4.2" /><path d="m9.5 9.5 5 5" /></S>,
  clock: <S><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.2 1.9" /></S>,
  stop: <S><rect x="7" y="7" width="10" height="10" rx="1.8" /></S>,
  x: <S><path d="M7 7l10 10M17 7 7 17" /></S>,
  check: <S><path d="M5 12l5 5 9-11" /></S>,
  chevronRight: <S w={1.65}><path d="M9 6.5 13 12 9 17.5" /></S>,
  chevronDown: <S w={1.65}><path d="M6.5 9 12 13 17.5 9" /></S>,
  lock: <S><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>,
  file: <S><path d="M7 3h7l4 4v14H7z" /><path d="M13 3v5h5" /></S>,
} as const;
