import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { Background, OttoMark } from "./components/ui";
import { FeatureCaption } from "./components/FeatureCaption";
import { OttoShellMock } from "./components/OttoShellMock";
import { BehaviorLoop, ProductOutro, RatificationBeat } from "./components/BehaviorLoop";
import { theme, fonts } from "./theme";
import { ottoTranslateY, useOttoEnter, useOttoFadeOut } from "./components/motion";
import {
  productDemoHookFrames,
  productDemoShellFrames,
  productDemoChatFrames,
  productDemoLoopFrames,
  productDemoMontageBeatFrames,
  productDemoRatifyFrames,
  productDemoOutroFrames,
} from "./features";

const HookScene: React.FC<{ dur: number }> = ({ dur }) => {
  const out = useOttoFadeOut(dur);
  const e1 = useOttoEnter(2);
  const e2 = useOttoEnter(12);
  const e3 = useOttoEnter(22);

  return (
    <AbsoluteFill style={{ opacity: out, alignItems: "center", justifyContent: "center", gap: 22 }}>
      <div style={{ opacity: e1, transform: `translateY(${ottoTranslateY(e1, 6)}px)` }}>
        <OttoMark size={96} delay={0} />
      </div>
      <div
        style={{
          opacity: e2,
          transform: `translateY(${ottoTranslateY(e2, 6)}px)`,
          fontFamily: fonts.mono,
          fontSize: 20,
          letterSpacing: 7,
          textTransform: "uppercase",
          color: theme.textFaint,
        }}
      >
        local-first desktop
      </div>
      <div
        style={{
          opacity: e2,
          transform: `translateY(${ottoTranslateY(e2, 6)}px)`,
          fontFamily: fonts.sans,
          fontSize: 96,
          fontWeight: 700,
          color: theme.text,
          letterSpacing: "-0.04em",
        }}
      >
        otto
      </div>
      <div
        style={{
          opacity: e3,
          transform: `translateY(${ottoTranslateY(e3, 6)}px)`,
          fontFamily: fonts.sans,
          fontSize: 30,
          color: theme.textDim,
        }}
      >
        behavior compounds
      </div>
    </AbsoluteFill>
  );
};

const MontageBeat: React.FC<{
  surface: "standards" | "curation" | "receipts";
}> = ({ surface }) => (
  <AbsoluteFill>
    <OttoShellMock surface={surface} delay={4} />
  </AbsoluteFill>
);

export const OttoProductDemo: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      <Series.Sequence durationInFrames={productDemoHookFrames}>
        <HookScene dur={productDemoHookFrames} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={productDemoShellFrames}>
        <OttoShellMock surface="chat" delay={6} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={productDemoChatFrames}>
        <AbsoluteFill>
          <OttoShellMock surface="chat" highlightComposer delay={0} />
          <FeatureCaption
            delay={12}
            kicker="ship · chat"
            title="Chat with your local agent"
            subtitle="Letta holds memory. otto is the desktop that improves behavior on top."
          />
        </AbsoluteFill>
      </Series.Sequence>

      <Series.Sequence durationInFrames={productDemoLoopFrames}>
        <BehaviorLoop startFrame={8} stepDuration={54} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={productDemoMontageBeatFrames}>
        <MontageBeat surface="standards" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={productDemoMontageBeatFrames}>
        <MontageBeat surface="curation" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={productDemoMontageBeatFrames}>
        <MontageBeat surface="receipts" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={productDemoRatifyFrames}>
        <RatificationBeat delay={8} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={productDemoOutroFrames}>
        <ProductOutro />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
