import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme, fonts } from "../theme";
import { FadeUp, OttoMark, useEntrance, useFadeOut } from "./ui";

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 13, height: 13, borderRadius: 999, background: c, display: "inline-block" }} />
);

const TitleFallback: React.FC<{ dur: number }> = ({ dur }) => {
  const out = useFadeOut(dur);
  return (
    <AbsoluteFill
      style={{
        opacity: out,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        backgroundColor: theme.bg2,
      }}
    >
      <OttoMark size={100} delay={2} />
      <FadeUp delay={12}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 21,
            letterSpacing: 7,
            color: theme.textFaint,
            textTransform: "uppercase",
          }}
        >
          local-first app
        </div>
      </FadeUp>
      <FadeUp delay={18}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 82,
            fontWeight: 700,
            color: theme.text,
            letterSpacing: "-0.03em",
          }}
        >
          otto desktop · v0.1
        </div>
      </FadeUp>
      <FadeUp delay={26}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 28,
            color: theme.textDim,
            maxWidth: 920,
            textAlign: "center",
            lineHeight: 1.45,
          }}
        >
          README hero screenshot pending — honest title card until asset lands
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

const ScreenshotHero: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(dur);
  const e = useEntrance(4);
  const scale = interpolate(e, [0, 1], [0.96, 1]);

  return (
    <AbsoluteFill
      style={{
        opacity: out,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        backgroundColor: theme.bg2,
      }}
    >
      <FadeUp delay={0}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 19,
            letterSpacing: 6,
            color: theme.textFaint,
            textTransform: "uppercase",
          }}
        >
          otto desktop · v0.1
        </div>
      </FadeUp>
      <div
        style={{
          opacity: e,
          transform: `scale(${scale})`,
          width: 1680,
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
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: fonts.mono,
              fontSize: 19,
              color: theme.textFaint,
            }}
          >
            otto
          </div>
          <div style={{ width: 54 }} />
        </div>
        <Img
          src={staticFile("otto-desktop.png")}
          style={{ width: "100%", display: "block" }}
        />
      </div>
      <div
        style={{
          opacity: interpolate(frame, [20, 36], [0, 1], { extrapolateRight: "clamp" }),
          fontFamily: fonts.mono,
          fontSize: 18,
          color: theme.textFaint,
        }}
      >
        local-first · Letta holds memory · otto improves behavior
      </div>
    </AbsoluteFill>
  );
};

export const DesktopHero: React.FC<{ dur: number; hasScreenshot: boolean }> = ({
  dur,
  hasScreenshot,
}) => (hasScreenshot ? <ScreenshotHero dur={dur} /> : <TitleFallback dur={dur} />);
