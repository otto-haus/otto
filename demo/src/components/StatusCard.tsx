import React from "react";
import { AbsoluteFill } from "remotion";
import { theme, fonts } from "../theme";
import { FadeUp, useEntrance } from "./ui";

export type Status = {
  built: boolean;
  tested: boolean | "manual" | "build";
  tried: boolean;
  approved: boolean;
};

const Check: React.FC<{ label: string; value: boolean | "manual" | "build"; delay: number }> = ({
  label,
  value,
  delay,
}) => {
  const e = useEntrance(delay);
  const on = value === true;
  const partial = value === "manual" || value === "build";
  const color = on ? theme.green : partial ? theme.amber : theme.textFaint;
  const glyph = on ? "✓" : partial ? "◑" : "▢";
  const note = value === "manual" ? " (manual)" : value === "build" ? " (build)" : "";
  return (
    <div
      style={{
        opacity: e,
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: fonts.mono,
        fontSize: 34,
        color,
      }}
    >
      <span style={{ width: 38, textAlign: "center" }}>{glyph}</span>
      <span style={{ color: on || partial ? theme.text : theme.textDim, minWidth: 220 }}>
        {label}
      </span>
      <span style={{ color, fontSize: 24 }}>{note}</span>
    </div>
  );
};

export const StatusCard: React.FC<{
  feature: string;
  status: Status;
  proves: string;
}> = ({ feature, status, proves }) => {
  return (
    <AbsoluteFill
      style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}
    >
      <FadeUp delay={2}>
        <div style={{ fontFamily: fonts.mono, fontSize: 22, letterSpacing: 6, color: theme.teal }}>
          {feature.toUpperCase()} — v0.1 STATUS
        </div>
      </FadeUp>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: "40px 56px",
          borderRadius: 18,
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
        }}
      >
        <Check label="Built" value={status.built} delay={8} />
        <Check label="Tested" value={status.tested} delay={16} />
        <Check label="Tried" value={status.tried} delay={24} />
        <Check label="Approved" value={status.approved} delay={32} />
      </div>
      <FadeUp delay={40}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 26,
            color: theme.textDim,
            maxWidth: 1100,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {proves}
        </div>
      </FadeUp>
      <FadeUp delay={48}>
        <div style={{ fontFamily: fonts.mono, fontSize: 20, color: theme.textFaint }}>
          Approval is Sebastian's. Nothing ships until he tries it and signs off.
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
