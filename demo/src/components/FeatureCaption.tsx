import React from "react";
import { AbsoluteFill } from "remotion";
import { theme, fonts } from "../theme";
import { ottoTranslateY, useOttoEnter } from "./motion";

export const FeatureCaption: React.FC<{
  kicker?: string;
  title: string;
  subtitle?: string;
  delay?: number;
  align?: "left" | "center";
}> = ({ kicker, title, subtitle, delay = 0, align = "left" }) => {
  const e = useOttoEnter(delay);
  const x = align === "center" ? "center" : "flex-start";
  const textAlign = align === "center" ? "center" : "left";

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        justifyContent: "flex-end",
        padding: align === "center" ? "0 120px 96px" : "0 0 96px 120px",
      }}
    >
      <div
        style={{
          opacity: e,
          transform: `translateY(${ottoTranslateY(e, 8)}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: x,
          gap: 12,
          maxWidth: 920,
        }}
      >
        {kicker ? (
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 20,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: theme.textFaint,
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 56,
            fontWeight: 650,
            letterSpacing: "-0.03em",
            color: theme.text,
            textAlign,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontFamily: fonts.sans,
              fontSize: 26,
              color: theme.textDim,
              textAlign,
              lineHeight: 1.45,
              maxWidth: 720,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
