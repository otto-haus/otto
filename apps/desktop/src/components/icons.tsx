import type React from 'react';

// Clean inline stroke icons. PNG/CSS-mask icons looked muddy at 18px and are blocked by release-gate.
const S: React.FC<{ children: React.ReactNode; w?: number }> = ({ children, w = 1.8 }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const Icon = {
  plus: <S w={1.9}><path d="M12 5v14M5 12h14" /></S>,
  panel: <S><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M9 5v14" /></S>,
  chat: <S><path d="M4 6h16a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4A1.5 1.5 0 0 1 2.5 14V7.5A1.5 1.5 0 0 1 4 6Z" /><circle cx="12" cy="10.7" r="2.3" /><circle cx="12" cy="10.7" r="0.95" fill="currentColor" stroke="none" /></S>,
  charter: <S><path d="M6.5 3.5h11v17h-11z" /><path d="M9 8h6M9 11h6" /><circle cx="12" cy="15.4" r="2" /><path d="M10.7 16.9l-.6 2.3 1.9-1.1 1.9 1.1-.6-2.3" /></S>,
  standards: <S><circle cx="12" cy="12" r="8.5" /><path d="M8.4 12.3l2.4 2.4 4.8-5.2" /></S>,
  practices: <S><path d="M9.5 6.5h9M9.5 12h9M9.5 17.5h9" /><circle cx="5.6" cy="6.5" r="1.3" fill="currentColor" stroke="none" /><circle cx="5.6" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="5.6" cy="17.5" r="1.3" fill="currentColor" stroke="none" /></S>,
  routines: <S><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 5v3.5h-3.5" /></S>,
  curation: <S><path d="M5 6.5h14l-5.5 7v4l-3-1.6V13.5z" /></S>,
  receipts: <S><path d="M7 3.5h10v15l-2-1.3-2 1.3-2-1.3-2 1.3V3.5z" /><path d="M9.5 8h5M9.5 11h5M9.5 14h3" /></S>,
  autonomy: <S><path d="M5 15.5a7 7 0 0 1 14 0" /><path d="M12 15.5l3.4-3.8" /><circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" /></S>,
  settings: <S><path d="M10.1 2.9h3.8v3l1.1.4 2.1-2.1 2.7 2.7-2.1 2.1.4 1.1h3v3.8h-3l-.4 1.1 2.1 2.1-2.7 2.7-2.1-2.1-1.1.4v3h-3.8v-3l-1.1-.4-2.1 2.1-2.7-2.7 2.1-2.1-.4-1.1h-3v-3.8h3l.4-1.1-2.1-2.1 2.7-2.7L9 6.3l1.1-.4z" /><circle cx="12" cy="12" r="2.3" /><circle cx="12" cy="12" r="0.85" fill="currentColor" stroke="none" /></S>,
  send: <S><path d="M4 12l16-7-7 16-2-7z" /></S>,
  image: <S><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 15l-5-5-11 11" /></S>,
  pin: <S><path d="m14.5 4.5 5 5-3.1 1.1-3.2 3.2-.6 4.7-2.9-2.9-4.2 4.2" /><path d="m9.5 9.5 5 5" /></S>,
  clock: <S><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.2 1.9" /></S>,
  owl: <S><path d="M4.8 9.2c0-3.2 2.3-5.7 5.1-5.7 1 0 1.7.3 2.1.8.4-.5 1.1-.8 2.1-.8 2.8 0 5.1 2.5 5.1 5.7v3.2c0 4.1-3 7.1-7.2 8.1-4.2-1-7.2-4-7.2-8.1z" /><circle cx="9.4" cy="10.2" r="1.45" /><circle cx="14.6" cy="10.2" r="1.45" /><path d="m10.9 13 1.1 1.2 1.1-1.2" /><path d="M7 5.2 4 3.8M17 5.2l3-1.4" /></S>,
  stop: <S><rect x="7" y="7" width="10" height="10" rx="1.8" /></S>,
  x: <S><path d="M7 7l10 10M17 7 7 17" /></S>,
  check: <S><path d="M5 12l5 5 9-11" /></S>,
  lock: <S><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>,
  file: <S><path d="M7 3h7l4 4v14H7z" /><path d="M13 3v5h5" /></S>,
} as const;
