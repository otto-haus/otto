import React from "react";
import { FeatureDemo } from "./FeatureDemo";
import { channelsFeature } from "./features";

/** Channels contract demo (#512) — Ship tier, no live bot. */
export const OttoV01Channels: React.FC = () => <FeatureDemo feature={channelsFeature} />;
