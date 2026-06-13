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
      style={{ opacity: out, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}
    >
      <OttoMark size={100} delay={2} />
      <FadeUp delay={10}>
        <div style={{ fontFamily: fonts.mono, fontSize: 21, letterSpacing: 7, color: theme.textFaint, textTransform: "uppercase" }}>
          {kicker}
        </div>
      </FadeUp>
      <FadeUp delay={16}>
        <div style={{ fontFamily: fonts.sans, fontSize: 82, fontWeight: 700, color: theme.text, letterSpacing: "-0.03em" }}>
          {feature}
        </div>
      </FadeUp>
      <FadeUp delay={24}>
        <div style={{ fontFamily: fonts.sans, fontSize: 29, color: theme.textDim, maxWidth: 1080, textAlign: "center", lineHeight: 1.4 }}>
          {tagline}
        </div>
      </FadeUp>
      <div style={{ height: 8 }} />
      <Pill delay={34}>otto · v0.1</Pill>
    </AbsoluteFill>
  );
};
