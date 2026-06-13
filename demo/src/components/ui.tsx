import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, fonts } from "../theme";
import { OwlMark } from "./icons";

/** Flat paper ground — hairline-first, no gradients/grid/glow (house standard). */
export const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: theme.bg }} />
);

export const useEntrance = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8, stiffness: 120 } });
};

export const FadeUp: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 24, children, style }) => {
  const e = useEntrance(delay);
  return (
    <div style={{ opacity: e, transform: `translateY(${interpolate(e, [0, 1], [y, 0])}px)`, ...style }}>
      {children}
    </div>
  );
};

export const useFadeOut = (durationInFrames: number, fadeFrames = 16) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [durationInFrames - fadeFrames, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/** Neutral pill — mono label, hairline border, small ink dot. No decorative color. */
export const Pill: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const e = useEntrance(delay);
  return (
    <span
      style={{
        opacity: e,
        transform: `scale(${interpolate(e, [0, 1], [0.94, 1])})`,
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        fontFamily: fonts.mono,
        fontSize: 20,
        letterSpacing: 1,
        color: theme.textDim,
        border: `1px solid ${theme.borderStrong}`,
        background: theme.panel,
        padding: "7px 15px",
        borderRadius: 999,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: theme.text }} />
      {children}
    </span>
  );
};

export const Cursor: React.FC<{ color?: string }> = ({ color = theme.accent }) => {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 15) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 11,
        height: 22,
        marginLeft: 2,
        transform: "translateY(4px)",
        background: on ? color : "transparent",
        borderRadius: 2,
      }}
    />
  );
};

/** Otto brand mark — the ink owl, optionally in a hairline tile. */
export const OttoMark: React.FC<{ size?: number; delay?: number }> = ({ size = 96, delay = 0 }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        opacity: e,
        transform: `scale(${interpolate(e, [0, 1], [0.9, 1])})`,
        width: size,
        height: size,
        borderRadius: size * 0.18,
        border: `1px solid ${theme.border}`,
        background: theme.panel,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <OwlMark size={size * 0.66} color={theme.text} />
    </div>
  );
};
