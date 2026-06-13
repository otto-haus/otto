import React from "react";
import { AbsoluteFill } from "remotion";
import { theme, fonts } from "../theme";
import { CutlineBadge, FadeUp, useEntrance } from "./ui";
import { IconCheckBox, IconBoxHalf, IconBoxEmpty } from "./icons";

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
  const note = value === "manual" ? "manual" : value === "build" ? "build" : "";
  return (
    <div style={{ opacity: e, display: "flex", alignItems: "center", gap: 16, fontFamily: fonts.mono, fontSize: 32 }}>
      <span style={{ width: 30, display: "flex" }}>
        {on ? <IconCheckBox size={28} /> : partial ? <IconBoxHalf size={28} /> : <IconBoxEmpty size={28} />}
      </span>
      <span style={{ color: on || partial ? theme.text : theme.textDim, minWidth: 210 }}>{label}</span>
      {note && <span style={{ color, fontSize: 22 }}>{note}</span>}
    </div>
  );
};

export const StatusCard: React.FC<{ feature: string; status: Status; proves: string; v01: "ship" | "proposed" | "deferred" }> = ({
  feature,
  status,
  proves,
  v01,
}) => {
  return (
    <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <FadeUp delay={2}>
        <div style={{ fontFamily: fonts.mono, fontSize: 21, letterSpacing: 5, color: theme.textFaint, textTransform: "uppercase" }}>
          {feature} — v0.1 status
        </div>
      </FadeUp>
      <CutlineBadge v01={v01} delay={5} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: "38px 54px",
          borderRadius: 16,
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 24px 70px rgba(16,17,20,0.10)",
        }}
      >
        <Check label="Built" value={status.built} delay={8} />
        <Check label="Tested" value={status.tested} delay={16} />
        <Check label="Tried" value={status.tried} delay={24} />
        <Check label="Approved" value={status.approved} delay={32} />
      </div>
      <FadeUp delay={40}>
        <div style={{ fontFamily: fonts.sans, fontSize: 26, color: theme.textDim, maxWidth: 1080, textAlign: "center", lineHeight: 1.45 }}>
          {proves}
        </div>
      </FadeUp>
      <FadeUp delay={48}>
        <div style={{ fontFamily: fonts.mono, fontSize: 19, color: theme.textFaint }}>
          Approval is Sebastian's. Nothing ships until he tries it and signs off.
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
