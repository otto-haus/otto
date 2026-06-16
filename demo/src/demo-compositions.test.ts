import { expect, test } from "bun:test";
import {
  channelsFeature,
  fieldNoteFeature,
  FPS,
  productDemoTotalFrames,
  v01Cutline,
} from "./features";

test("OttoV01Channels and OttoV01FieldNote use honest ship-tier badges", () => {
  expect(channelsFeature.id).toBe("OttoV01Channels");
  expect(fieldNoteFeature.id).toBe("OttoV01FieldNote");
  expect(v01Cutline.OttoV01Channels).toBe("ship");
  expect(v01Cutline.OttoV01FieldNote).toBe("proposed");
  expect(channelsFeature.status.tried).toBe(false);
  expect(channelsFeature.status.approved).toBe(false);
  expect(fieldNoteFeature.status.tried).toBe(false);
  expect(fieldNoteFeature.status.approved).toBe(false);
});

test("OttoProductDemo uses honest ship tier and ~54s duration", () => {
  expect(v01Cutline.OttoProductDemo).toBe("ship");
  expect(productDemoTotalFrames / FPS).toBe(54);
});
