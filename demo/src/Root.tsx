import React from "react";
import { Composition } from "remotion";
import { FeatureDemo } from "./FeatureDemo";
import { OttoV01DesktopWalkthrough } from "./OttoV01DesktopWalkthrough";
import { OttoV01Curation } from "./OttoV01Curation";
import { OttoV01Tickets } from "./OttoV01Tickets";
import { OttoProductDemo } from "./OttoProductDemo";
import {
  features,
  curationFeature,
  ticketsFeature,
  totalFrames,
  FPS,
  walkthroughTotalFrames,
  productDemoTotalFrames,
} from "./features";

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
      <Composition
        id="OttoV01Curation"
        component={OttoV01Curation}
        durationInFrames={totalFrames(curationFeature.lines.length)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="OttoV01Tickets"
        component={OttoV01Tickets}
        durationInFrames={totalFrames(ticketsFeature.lines.length)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="OttoProductDemo"
        component={OttoProductDemo}
        durationInFrames={productDemoTotalFrames}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
