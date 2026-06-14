import React from 'react';

export const CultureCard: React.FC<{
  label: string;
  hint: string;
  onClick: () => void;
}> = ({ label, hint, onClick }) => (
  <button type="button" className="card cultureCard" onClick={onClick}>
    <span className="card__title">{label}</span>
    <span className="card__sub">{hint}</span>
  </button>
);
