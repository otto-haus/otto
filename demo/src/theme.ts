import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

const inter = loadInter();
const mono = loadMono();

// Otto demo palette — the LIGHT house system (near-monochrome on cool neutrals,
// hairline-first, status only on dots/pills, Action blue for commands only).
export const theme = {
  bg: "#f2f5f4",        // Field — ground
  bg2: "#fbfaf7",       // Paper
  panel: "#ffffff",     // record surface
  panelBar: "#f2f5f4",
  border: "#d9ded9",    // Line
  borderStrong: "#c7ccc7",

  text: "#101114",      // Ink
  textDim: "#536173",   // Muted ink
  textFaint: "#8b9099",

  accent: "#245cff",    // Action blue — commands only
  green: "#2f7d52",
  amber: "#9a6b1f",
  red: "#b3261e",

  greenTint: "#e6f1ea",
  amberTint: "#f5eedd",

  tlRed: "#FF5F57",
  tlYellow: "#FEBC2E",
  tlGreen: "#28C840",
} as const;

export const fonts = {
  sans: `${inter.fontFamily}, system-ui, -apple-system, sans-serif`,
  mono: `${mono.fontFamily}, ui-monospace, "SF Mono", Menlo, monospace`,
} as const;
