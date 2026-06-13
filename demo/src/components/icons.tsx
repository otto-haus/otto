import React from "react";
import { theme } from "../theme";

const Svg: React.FC<{ children: React.ReactNode; color: string; size: number; w?: number }> = ({
  children,
  color,
  size,
  w = 2.2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    {children}
  </svg>
);

export const IconCheck: React.FC<{ color?: string; size?: number }> = ({ color = theme.green, size = 20 }) => (
  <Svg color={color} size={size}><path d="M5 12l4.5 4.5L19 6.5" /></Svg>
);

export const IconGate: React.FC<{ color?: string; size?: number }> = ({ color = theme.amber, size = 20 }) => (
  <Svg color={color} size={size}><rect x="4.5" y="10.5" width="15" height="9" rx="1.6" /><path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" /></Svg>
);

export const IconBoxEmpty: React.FC<{ color?: string; size?: number }> = ({ color = theme.textFaint, size = 26 }) => (
  <Svg color={color} size={size} w={2}><rect x="5" y="5" width="14" height="14" rx="2.5" /></Svg>
);

export const IconBoxHalf: React.FC<{ color?: string; size?: number }> = ({ color = theme.amber, size = 26 }) => (
  <Svg color={color} size={size} w={2}><rect x="5" y="5" width="14" height="14" rx="2.5" /><path d="M12 5v14" /></Svg>
);

export const IconCheckBox: React.FC<{ color?: string; size?: number }> = ({ color = theme.green, size = 26 }) => (
  <Svg color={color} size={size} w={2}><rect x="5" y="5" width="14" height="14" rx="2.5" /><path d="M8.5 12l2.4 2.4L15.5 9.6" /></Svg>
);

// Scholarly owl line-mark, ink by default.
export const OwlMark: React.FC<{ color?: string; size?: number }> = ({ color = theme.text, size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 19a13 13 0 0 1 26 0v6a13 13 0 0 1-26 0z" />
    <path d="M11 19l-3-5M37 19l3-5" />
    <circle cx="19" cy="22" r="3.2" />
    <circle cx="29" cy="22" r="3.2" />
    <circle cx="19" cy="22" r="0.6" fill={color} stroke={color} />
    <circle cx="29" cy="22" r="0.6" fill={color} stroke={color} />
    <path d="M22.5 26.5L24 29l1.5-2.5z" fill={color} stroke="none" />
  </svg>
);
