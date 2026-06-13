import React from "react";
import { AbsoluteFill } from "remotion";
import { theme, fonts } from "../theme";
import { FadeUp, OttoMark, Pill, useFadeOut } from "./ui";

export const TitleCard: React.FC<{
  dur: number;
  feature: string;
  tagline: string;
  kicker: string;
}> = ({ dur, feature, tagline, kicker }) => {
  const out = useFadeOut(dur);
  return (
    <AbsoluteFill
      style={{
        opacity: out,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
      }}
    >
      <OttoMark size={104} delay={2} />
      <FadeUp delay={10}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 22,
            letterSpacing: 8,
            color: theme.teal,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>
      </FadeUp>
      <FadeUp delay={16}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 84,
            fontWeight: 700,
            color: theme.text,
            letterSpacing: -1,
          }}
        >
          {feature}
        </div>
      </FadeUp>
      <FadeUp delay={24}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 30,
            color: theme.textDim,
            maxWidth: 1100,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {tagline}
        </div>
      </FadeUp>
      <div style={{ height: 8 }} />
      <Pill delay={34}>otto · v0.1</Pill>
    </AbsoluteFill>
  );
};
