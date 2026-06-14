import React from "react";
import { Composition } from "remotion";
import { FeatureDemo } from "./FeatureDemo";
import { OttoV01DesktopWalkthrough } from "./OttoV01DesktopWalkthrough";
import { features, totalFrames, FPS, walkthroughTotalFrames } from "./features";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {features.map((f) => (
        <Composition
          key={f.id}
          id={f.id}
          component={FeatureDemo}
          durationInFrames={totalFrames(f.lines.length)}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{ feature: f }}
        />
      ))}
      <Composition
        id="OttoV01DesktopWalkthrough"
        component={OttoV01DesktopWalkthrough}
        durationInFrames={walkthroughTotalFrames}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ hasScreenshot: false }}
      />
    </>
  );
};
