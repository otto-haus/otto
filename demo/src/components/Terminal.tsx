import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme, fonts } from "../theme";
import { Cursor } from "./ui";
import { IconCheck as Check, IconGate as Gate } from "./icons";

export type LineKind = "cmd" | "out" | "good" | "gate" | "head" | "file" | "dim" | "rule";

export type Line = { kind: LineKind; text?: string; at?: number };

const colorFor = (kind: LineKind): string => {
  switch (kind) {
    case "good": return theme.green;
    case "gate": return theme.amber;
    case "head": return theme.text;
    case "file": return theme.textDim;
    case "dim": return theme.textFaint;
    default: return theme.textDim;
  }
};

const Row: React.FC<{ line: Required<Line>; localFrame: number }> = ({ line, localFrame }) => {
  const d = localFrame - line.at;
  if (d < 0) return null;
  const o = interpolate(d, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const ty = interpolate(d, [0, 8], [6, 0], { extrapolateRight: "clamp" });

  if (line.kind === "rule") {
    return <div style={{ opacity: o, height: 1, background: theme.border, margin: "12px 0" }} />;
  }

  const isCmd = line.kind === "cmd";
  const isGate = line.kind === "gate";
  const isGood = line.kind === "good";

  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${ty}px)`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        lineHeight: 1.5,
        fontFamily: fonts.mono,
        fontSize: 23,
        color: colorFor(line.kind),
        padding: isGate ? "7px 14px" : "2px 0",
        margin: isGate ? "6px 0" : 0,
        background: isGate ? theme.amberTint : "transparent",
        borderLeft: isGate ? `3px solid ${theme.amber}` : "3px solid transparent",
        borderRadius: isGate ? 6 : 0,
        fontWeight: line.kind === "head" || isCmd ? 600 : 400,
      }}
    >
      {isCmd && <span style={{ color: theme.accent, fontWeight: 700 }}>›</span>}
      {isGood && <Check size={20} />}
      {isGate && <Gate size={20} />}
      <span style={{ color: isCmd ? theme.text : undefined }}>{line.text}</span>
    </div>
  );
};

export const Terminal: React.FC<{ title?: string; lines: Required<Line>[]; width?: number }> = ({
  title = "otto",
  lines,
  width = 1360,
}) => {
  const localFrame = useCurrentFrame();
  const visible = lines.filter((l) => localFrame >= l.at);
  const lastAt = visible.length ? visible[visible.length - 1].at : 0;
  const showCursor = localFrame - lastAt > 6;

  return (
    <div
      style={{
        width,
        margin: "0 auto",
        borderRadius: 16,
        overflow: "hidden",
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 24px 70px rgba(16,17,20,0.10)",
      }}
    >
      <div
        style={{
          height: 52,
          background: theme.panelBar,
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 10,
        }}
      >
        <Dot c={theme.tlRed} />
        <Dot c={theme.tlYellow} />
        <Dot c={theme.tlGreen} />
        <div style={{ flex: 1, textAlign: "center", fontFamily: fonts.mono, fontSize: 19, color: theme.textFaint, letterSpacing: 0.5 }}>
          {title}
        </div>
        <div style={{ width: 54 }} />
      </div>

      <div style={{ padding: "26px 32px", height: 760, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
        {lines.map((line, i) => (
          <Row key={i} line={line} localFrame={localFrame} />
        ))}
        {showCursor && (
          <div style={{ marginTop: 4, display: "flex", alignItems: "center" }}>
            <span style={{ color: theme.accent, fontFamily: fonts.mono, fontSize: 26, fontWeight: 700 }}>›</span>
            <Cursor />
          </div>
        )}
      </div>
    </div>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 13, height: 13, borderRadius: 999, background: c, display: "inline-block" }} />
);
