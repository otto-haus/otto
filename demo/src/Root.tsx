import React from "react";
import { Composition } from "remotion";
import { FeatureDemo } from "./FeatureDemo";
import { features, totalFrames, FPS } from "./features";

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
    </>
  );
};
