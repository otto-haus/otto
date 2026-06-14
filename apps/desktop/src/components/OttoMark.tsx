import type React from 'react';
import ottoAvatar from '../assets/otto-avatar.png';

type OttoMarkProps = {
  size?: number;
  className?: string;
};

/** Portrait owl mark — always rendered at an explicit pixel size (never intrinsic/full-bleed). */
export const OttoMark: React.FC<OttoMarkProps> = ({ size = 32, className = '' }) => (
  <img
    src={ottoAvatar}
    alt=""
    width={size}
    height={size}
    className={['ottoMark', className].filter(Boolean).join(' ')}
    style={{
      width: size,
      height: size,
      minWidth: size,
      maxWidth: size,
      minHeight: size,
      maxHeight: size,
      flexShrink: 0,
    }}
    draggable={false}
    decoding="async"
  />
);
