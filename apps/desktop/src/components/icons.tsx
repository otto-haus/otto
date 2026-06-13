import React from 'react';

const S: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Icon = {
  chat: <S><path d="M4 5h16v11H8l-4 3z" /></S>,
  charter: <S><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 13h7M9 17h5" /></S>,
  standards: <S><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /></S>,
  practices: <S><rect x="5" y="4" width="14" height="6" rx="1.5" /><rect x="5" y="14" width="14" height="6" rx="1.5" /></S>,
  routines: <S><path d="M4 12a8 8 0 1 1 2.3 5.6" /><path d="M4 20v-4h4" /></S>,
  curation: <S><path d="M5 7h14M5 12h10M5 17h7" /><circle cx="17" cy="16" r="2.6" /></S>,
  receipts: <S><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></S>,
  autonomy: <S><circle cx="12" cy="12" r="8" /><path d="M12 4v4M12 16v4M4 12h4M16 12h4" /></S>,
  settings: <S><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" /></S>,
  owl: <S><path d="M5 9a7 7 0 0 1 14 0v4a7 7 0 0 1-14 0z" /><circle cx="9.4" cy="10" r="1.5" /><circle cx="14.6" cy="10" r="1.5" /><path d="M11 12.6h2l-1 1.6z" /><path d="M5 9 3 6M19 9l2-3" /></S>,
  send: <S><path d="M4 12l16-7-7 16-2-7z" /></S>,
  check: <S><path d="M5 12l5 5 9-11" /></S>,
  lock: <S><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>,
  file: <S><path d="M7 3h7l4 4v14H7z" /><path d="M13 3v5h5" /></S>,
} as const;
