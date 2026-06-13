import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fonts } from "../theme";

/** Animated background: deep gradient + drifting grid + vignette. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.25) % 64;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 700px at 50% -10%, ${theme.bg2} 0%, ${theme.bg} 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          backgroundPosition: `0px ${drift}px`,
          maskImage:
            "radial-gradient(1100px 650px at 50% 42%, rgba(0,0,0,0.9), transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(1100px 650px at 50% 42%, rgba(0,0,0,0.9), transparent 80%)",
        }}
      />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 320px 80px rgba(0,0,0,0.7)" }} />
    </AbsoluteFill>
  );
};

export const useEntrance = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping, mass: 0.8, stiffness: 120 },
  });
};

export const FadeUp: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 28, children, style }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [y, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Fade out helper for the last N frames of a sequence. */
export const useFadeOut = (durationInFrames: number, fadeFrames = 16) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [durationInFrames - fadeFrames, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
};

export const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
  delay?: number;
}> = ({ children, color = theme.teal, delay = 0 }) => {
  const e = useEntrance(delay);
  return (
    <span
      style={{
        opacity: e,
        transform: `scale(${interpolate(e, [0, 1], [0.9, 1])})`,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontFamily: fonts.mono,
        fontSize: 22,
        letterSpacing: 1,
        color,
        border: `1px solid ${color}55`,
        background: `${color}12`,
        padding: "8px 16px",
        borderRadius: 999,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
      {children}
    </span>
  );
};

export const Cursor: React.FC<{ color?: string }> = ({ color = theme.teal }) => {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 15) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 12,
        height: 24,
        marginLeft: 2,
        transform: "translateY(4px)",
        background: on ? color : "transparent",
        borderRadius: 2,
      }}
    />
  );
};

/** Otto wordmark glyph — a simple ringed "o", drawn, not an asset. */
export const OttoMark: React.FC<{ size?: number; delay?: number }> = ({
  size = 96,
  delay = 0,
}) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${Math.round(size * 0.08)}px solid ${theme.teal}`,
        boxShadow: `0 0 ${size * 0.4}px ${theme.teal}55, inset 0 0 ${size * 0.2}px ${theme.teal}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: e,
        transform: `scale(${interpolate(e, [0, 1], [0.8, 1])})`,
      }}
    >
      <div
        style={{
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: "50%",
          background: theme.teal,
          boxShadow: `0 0 ${size * 0.25}px ${theme.teal}`,
        }}
      />
    </div>
  );
};
