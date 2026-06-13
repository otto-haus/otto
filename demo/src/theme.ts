// Otto demo palette — calm, dark, console-grade. No marketing gradients.
export const theme = {
  bg: "#0A0D13",
  bg2: "#0E131C",
  panel: "#0E141D",
  panelBar: "#141B26",
  border: "#1E2A38",
  grid: "rgba(120, 150, 190, 0.05)",

  text: "#E8EEF6",
  textDim: "#8A98AB",
  textFaint: "#56657A",

  teal: "#4FD8C4",
  blue: "#6AA6FF",
  green: "#5BD6A0",
  amber: "#F5C451",
  red: "#FF6B6B",
  violet: "#A78BFA",

  tlRed: "#FF5F57",
  tlYellow: "#FEBC2E",
  tlGreen: "#28C840",
} as const;

export const fonts = {
  sans:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif',
  mono:
    '"SF Mono", "JetBrains Mono", "Menlo", "DejaVu Sans Mono", ui-monospace, monospace',
} as const;
