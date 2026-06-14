import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { Background, FadeUp } from "./components/ui";
import { DesktopHero } from "./components/DesktopHero";
import { Terminal, Line } from "./components/Terminal";
import { TitleCard } from "./components/TitleCard";
import { theme, fonts } from "./theme";
import {
  walkthroughHeroFrames,
  walkthroughTitleFrames,
  walkthroughBeatFrames,
  walkthroughClosingFrames,
  walkthroughOutroFrames,
  walkthroughTermStart,
  walkthroughLineStep,
} from "./features";

const BeatScene: React.FC<{
  kicker: string;
  termTitle: string;
  lines: Line[];
}> = ({ kicker, termTitle, lines }) => {
  const scheduled: Required<Line>[] = lines.map((l, i) => ({
    kind: l.kind,
    text: l.text ?? "",
    at: walkthroughTermStart + i * walkthroughLineStep,
  }));

  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
      }}
    >
      <FadeUp delay={2}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 22,
            letterSpacing: 8,
            color: theme.textFaint,
          }}
        >
          {kicker.toUpperCase()}
        </div>
      </FadeUp>
      <Terminal title={termTitle} lines={scheduled} width={1380} />
    </AbsoluteFill>
  );
};

const connectLines: Line[] = [
  { kind: "cmd", text: "git clone https://github.com/otto-haus/otto.git && cd otto" },
  { kind: "cmd", text: "bun install && task electron" },
  { kind: "good", text: "desktop launches — local-only v0.1" },
  { kind: "dim", text: "Letta holds persistent memory · Otto improves behavior" },
  { kind: "rule" },
  { kind: "head", text: "Connect to a local Letta agent" },
  { kind: "cmd", text: "Settings → discover Letta runtime URL" },
  { kind: "good", text: "agent identity from Letta local settings when possible" },
  { kind: "out", text: "manual URL / Agent ID — advanced overrides only" },
  { kind: "dim", text: "provider auth stays in Letta, not duplicated in otto" },
];

const chatLines: Line[] = [
  { kind: "head", text: "Chat with the persistent agent" },
  { kind: "cmd", text: "composer → send to Letta-backed session" },
  { kind: "good", text: "Markdown renders cleanly in assistant replies" },
  { kind: "good", text: "queued sends preserve follow-ups while otto is working" },
  { kind: "out", text: "model + reasoning effort controls visible in composer" },
  { kind: "gate", text: "chat unlocks only after session.initialize() succeeds" },
  { kind: "out", text: "connected means connected · missing means diagnosed" },
];

const surfacesLines: Line[] = [
  { kind: "head", text: "Behavior surfaces (file-backed today)" },
  { kind: "file", text: "standards/     explicit canon · human-ratified" },
  { kind: "file", text: "practices/     executable workflow specs" },
  { kind: "file", text: "curation/      proposed refinements queue" },
  { kind: "file", text: "receipts/      proof artifacts on disk" },
  { kind: "rule" },
  { kind: "dim", text: "no fake curation loop · no auto-ratification in v0.1" },
  { kind: "dim", text: "full proposal / ratification loop — not shipped yet" },
  { kind: "good", text: "honest placeholders until each surface ships in-app" },
];

const ClosingCard: React.FC<{ dur: number }> = ({ dur }) => (
  <TitleCard
    dur={dur}
    feature="what works today"
    kicker="v0.1 desktop demo"
    tagline="Chat with Letta · truthful setup · file-backed behavior surfaces — no fake operational data."
    v01="ship"
  />
);

const MiniOutro: React.FC = () => (
  <AbsoluteFill
    style={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
    }}
  >
    <FadeUp delay={2}>
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 44,
          fontWeight: 650,
          color: theme.text,
          letterSpacing: "-0.02em",
          textAlign: "center",
          maxWidth: 980,
          lineHeight: 1.35,
        }}
      >
        Letta remembers. Otto improves.
      </div>
    </FadeUp>
    <FadeUp delay={14}>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 22,
          color: theme.textDim,
          textAlign: "center",
          maxWidth: 920,
          lineHeight: 1.5,
        }}
      >
        github.com/otto-haus/otto · source install today · signed installer later
      </div>
    </FadeUp>
  </AbsoluteFill>
);

export const OttoV01DesktopWalkthrough: React.FC<{ hasScreenshot?: boolean }> = ({
  hasScreenshot = false,
}) => (
  <AbsoluteFill>
    <Background />
    <Series>
      <Series.Sequence durationInFrames={walkthroughHeroFrames}>
        <DesktopHero dur={walkthroughHeroFrames} hasScreenshot={hasScreenshot} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={walkthroughTitleFrames}>
        <TitleCard
          dur={walkthroughTitleFrames}
          feature="Letta remembers. Otto improves."
          kicker="the split"
          tagline="Letta holds persistent agent memory. Otto is the local desktop that improves behavior on top."
          v01="ship"
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={walkthroughBeatFrames(connectLines.length)}>
        <BeatScene
          kicker="setup"
          termTitle="otto desktop — connect"
          lines={connectLines}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={walkthroughBeatFrames(chatLines.length)}>
        <BeatScene kicker="chat" termTitle="otto desktop — chat" lines={chatLines} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={walkthroughBeatFrames(surfacesLines.length)}>
        <BeatScene
          kicker="behavior"
          termTitle="otto desktop — surfaces"
          lines={surfacesLines}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={walkthroughClosingFrames}>
        <ClosingCard dur={walkthroughClosingFrames} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={walkthroughOutroFrames}>
        <MiniOutro />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
