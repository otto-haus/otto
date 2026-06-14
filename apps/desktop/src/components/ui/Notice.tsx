import React from 'react';

export const Notice: React.FC<{
  tone?: 'warn' | 'ok' | 'idle';
  children: React.ReactNode;
}> = ({ tone = 'warn', children }) => (
  <div className="notice">
    <span className={`dot dot--${tone === 'ok' ? 'ok' : tone === 'idle' ? 'idle' : 'warn'}`} />
    {children}
  </div>
);
