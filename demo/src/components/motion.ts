import { Easing, interpolate, useCurrentFrame } from "remotion";

/** otto brand §09 — cubic-bezier(0.2, 0, 0, 1), max 240ms @ 30fps ≈ 7 frames enter */
export const OTTO_EASE = Easing.bezier(0.2, 0, 0, 1);

export const microFrames = 4; // ~120ms
export const stateFrames = 5; // ~180ms
export const enterFrames = 7; // ~240ms

export const useOttoEnter = (delay = 0, duration = enterFrames) => {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OTTO_EASE,
  });
};

export const useOttoFadeOut = (durationInFrames: number, fadeFrames = microFrames) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [durationInFrames - fadeFrames, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OTTO_EASE,
  });
};

export const ottoTranslateY = (progress: number, px = 6) =>
  interpolate(progress, [0, 1], [px, 0], { easing: OTTO_EASE });

export const ottoScale = (progress: number, from = 0.98) =>
  interpolate(progress, [0, 1], [from, 1], { easing: OTTO_EASE });
