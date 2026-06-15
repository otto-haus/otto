import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme, fonts } from "../theme";
import { OTTO_EASE, ottoScale, ottoTranslateY, useOttoEnter } from "./motion";

const STEPS = [
  "correction",
  "proposal",
  "ratification",
  "standard",
  "receipt",
] as const;

const LoopStep: React.FC<{
  step: (typeof STEPS)[number];
  index: number;
  activeIndex: number;
  startFrame: number;
}> = ({ step, index, activeIndex, startFrame }) => {
  const enter = useOttoEnter(startFrame + index * 8);
  const isActive = index === activeIndex;
  const isPast = index < activeIndex;
  const opacity = isActive ? 1 : isPast ? 0.45 : interpolate(enter, [0, 1], [0.25, 0.35]);

  return (
    <div
      style={{
        opacity,
        transform: isActive
          ? `translateY(${ottoTranslateY(1, 0)}px) scale(${ottoScale(1)})`
          : `translateY(${ottoTranslateY(enter, 4)}px)`,
        fontFamily: fonts.sans,
        fontSize: isActive ? 42 : 30,
        fontWeight: isActive ? 700 : 550,
        padding: isActive ? "14px 22px" : "8px 12px",
        borderRadius: 12,
        background: isActive ? theme.text : "transparent",
        color: isActive ? theme.bg2 : theme.textDim,
        ...(isActive ? {} : { border: `1px solid ${theme.border}` }),
      }}
    >
      {step}
    </div>
  );
};

export const BehaviorLoop: React.FC<{ startFrame?: number; stepDuration?: number }> = ({
  startFrame = 0,
  stepDuration = 54,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - startFrame);
  const activeIndex = Math.min(STEPS.length - 1, Math.floor(local / stepDuration));

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 120 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%" }}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 18,
            letterSpacing: 7,
            textTransform: "uppercase",
            color: theme.textFaint,
          }}
        >
          how behavior compounds
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 ? (
                <span style={{ fontFamily: fonts.mono, fontSize: 22, color: theme.textFaint }}>→</span>
              ) : null}
              <LoopStep step={step} index={i} activeIndex={activeIndex} startFrame={startFrame} />
            </React.Fragment>
          ))}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: fonts.sans,
            fontSize: 24,
            color: theme.textDim,
            textAlign: "center",
            maxWidth: 820,
            lineHeight: 1.45,
            opacity: interpolate(
              local,
              [stepDuration * (STEPS.length - 1), stepDuration * STEPS.length],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: OTTO_EASE },
            ),
          }}
        >
          Corrections become proposals. You ratify. Canon moves. The next action is better.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RatificationBeat: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const e = useOttoEnter(delay);
  const scale = ottoScale(e);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: e,
          transform: `scale(${scale})`,
          background: theme.text,
          color: theme.bg2,
          borderRadius: 18,
          padding: "48px 64px",
          maxWidth: 920,
          textAlign: "center",
          boxShadow: "0 24px 70px rgba(16,17,20,0.14)",
        }}
      >
        <div style={{ fontFamily: fonts.mono, fontSize: 16, letterSpacing: 6, textTransform: "uppercase", opacity: 0.7 }}>
          ratification
        </div>
        <div style={{ fontFamily: fonts.sans, fontSize: 46, fontWeight: 650, marginTop: 16, lineHeight: 1.2 }}>
          You ratify. otto records the proof.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ProductOutro: React.FC = () => {
  const e1 = useOttoEnter(4);
  const e2 = useOttoEnter(16);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div
        style={{
          opacity: e1,
          transform: `translateY(${ottoTranslateY(e1, 6)}px)`,
          fontFamily: fonts.sans,
          fontSize: 52,
          fontWeight: 650,
          color: theme.text,
          letterSpacing: "-0.02em",
          textAlign: "center",
          maxWidth: 980,
          lineHeight: 1.25,
        }}
      >
        Letta remembers. Otto improves.
      </div>
      <div
        style={{
          opacity: e2,
          fontFamily: fonts.mono,
          fontSize: 22,
          color: theme.textDim,
        }}
      >
        github.com/otto-haus/otto
      </div>
    </AbsoluteFill>
  );
};
