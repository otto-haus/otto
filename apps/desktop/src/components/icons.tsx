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
  plus: <S><path d="M12 5v14M5 12h14" /></S>,
  panel: <S><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M9 5v14" /></S>,
  chat: <S><path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7.2a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 15.2V8A1.5 1.5 0 0 1 5 6.5Z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" /></S>,
  charter: <S><path d="M7 3.5h7.5L18 7v13.5H7z" /><path d="M14.5 3.5V7H18" /><path d="M10 12h5M10 16h4" /></S>,
  standards: <S><circle cx="12" cy="12" r="8.5" /><path d="m8.7 12.3 2.2 2.2 4.8-5" /></S>,
  practices: <S><path d="M6 5.5h12M6 12h12M6 18.5h12" /><circle cx="6" cy="5.5" r="1.7" /><circle cx="6" cy="12" r="1.7" /><circle cx="6" cy="18.5" r="1.7" /></S>,
  routines: <S><path d="M5.5 13a6.5 6.5 0 1 0 1.9-4.6" /><path d="M5.5 6.5v4h4" /><path d="M12 8v4l2.7 1.6" /></S>,
  curation: <S><path d="M5 6h14M7 12h10M10 18h4" /><path d="m9 6 3 6 3-6" /></S>,
  receipts: <S><path d="M7 3.5h10v17l-2.5-1.6-2.5 1.6-2.5-1.6L7 20.5z" /><path d="M10 8h4M10 12h4" /></S>,
  autonomy: <S><path d="M12 4.5c4 1.8 6 4.2 6 7.3 0 3.5-2.4 6.1-6 7.7-3.6-1.6-6-4.2-6-7.7 0-3.1 2-5.5 6-7.3Z" /><path d="M12 8.5v3.8l2.4 1.5" /></S>,
  settings: <S><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M4.6 7l1.9 1.1M17.5 15.9l1.9 1.1M4.6 17l1.9-1.1M17.5 8.1 19.4 7" /></S>,
  pin: <S><path d="m14.5 4.5 5 5-3.1 1.1-3.2 3.2-.6 4.7-2.9-2.9-4.2 4.2" /><path d="m9.5 9.5 5 5" /></S>,
  clock: <S><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.2 1.9" /></S>,
  owl: <S><path d="M4.8 9.2c0-3.2 2.3-5.7 5.1-5.7 1 0 1.7.3 2.1.8.4-.5 1.1-.8 2.1-.8 2.8 0 5.1 2.5 5.1 5.7v3.2c0 4.1-3 7.1-7.2 8.1-4.2-1-7.2-4-7.2-8.1z" /><circle cx="9.4" cy="10.2" r="1.45" /><circle cx="14.6" cy="10.2" r="1.45" /><path d="m10.9 13 1.1 1.2 1.1-1.2" /><path d="M7 5.2 4 3.8M17 5.2l3-1.4" /></S>,
  send: <S><path d="M4 12l16-7-7 16-2-7z" /></S>,
  check: <S><path d="M5 12l5 5 9-11" /></S>,
  lock: <S><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>,
  file: <S><path d="M7 3h7l4 4v14H7z" /><path d="M13 3v5h5" /></S>,
} as const;
