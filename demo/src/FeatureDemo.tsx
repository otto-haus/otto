import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { Background, FadeUp } from "./components/ui";
import { Terminal, Line } from "./components/Terminal";
import { TitleCard } from "./components/TitleCard";
import { StatusCard } from "./components/StatusCard";
import { theme, fonts } from "./theme";
import {
  Feature,
  introFrames,
  outroFrames,
  bodyFrames,
  termStart,
  lineStep,
} from "./features";

const TerminalScene: React.FC<{ feature: Feature; lines: Required<Line>[] }> = ({
  feature,
  lines,
}) => (
  <AbsoluteFill
    style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}
  >
    <FadeUp delay={2}>
      <div style={{ fontFamily: fonts.mono, fontSize: 22, letterSpacing: 8, color: theme.textFaint }}>
        {feature.kicker.toUpperCase()}
      </div>
    </FadeUp>
    <Terminal title={feature.termTitle} lines={lines} width={1380} />
  </AbsoluteFill>
);

export const FeatureDemo: React.FC<{ feature: Feature }> = ({ feature }) => {
  const body = bodyFrames(feature.lines.length);
  const lines: Required<Line>[] = feature.lines.map((l, i) => ({
    kind: l.kind,
    text: l.text ?? "",
    at: termStart + i * lineStep,
  }));
  return (
    <AbsoluteFill>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={introFrames}>
          <TitleCard
            dur={introFrames}
            feature={feature.name}
            tagline={feature.tagline}
            kicker={feature.kicker}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={body}>
          <TerminalScene feature={feature} lines={lines} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={outroFrames}>
          <StatusCard feature={feature.name} status={feature.status} proves={feature.proves} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
