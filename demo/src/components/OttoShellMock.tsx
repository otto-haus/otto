import React from "react";
import { AbsoluteFill } from "remotion";
import { theme, fonts } from "../theme";
import { OwlMark } from "./icons";
import { ottoScale, useOttoEnter } from "./motion";

export type MockSurface = "chat" | "standards" | "curation" | "receipts";

type NavItem = { id: MockSurface | "practices"; label: string; active?: boolean };

const NAV: NavItem[] = [
  { id: "chat", label: "Chat" },
  { id: "standards", label: "Standards" },
  { id: "practices", label: "Practices" },
  { id: "curation", label: "Curation" },
  { id: "receipts", label: "Receipts" },
];

const EMPTY: Record<
  MockSurface,
  { eyebrow: string; title: string; body: string; path?: string }
> = {
  chat: {
    eyebrow: "chat",
    title: "The behavior layer for persistent agents.",
    body: "otto ships as one desktop app. It records what your agent relied on before it acted — and changes the next run only when you ratify it.",
  },
  standards: {
    eyebrow: "standards",
    title: "Standards load from canon files.",
    body: "Explicit rules — what otto rewards, refuses, and does under pressure.",
    path: "standards/",
  },
  curation: {
    eyebrow: "curation",
    title: "Nothing waiting on you",
    body: "When otto proposes a behavior change, it lands here for ratification before canon moves.",
    path: "~/.otto/curation/proposals/",
  },
  receipts: {
    eyebrow: "receipts",
    title: "No proof yet",
    body: "Send or block a chat turn, ratify a proposal, or run a practice — otto writes a receipt when behavior completes.",
    path: "~/.otto/receipts/",
  },
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 11, height: 11, borderRadius: 999, background: c, display: "inline-block" }} />
);

const Sidebar: React.FC<{ active: MockSurface | "practices" }> = ({ active }) => (
  <div
    style={{
      width: 248,
      borderRight: `1px solid ${theme.border}`,
      background: theme.panel,
      display: "flex",
      flexDirection: "column",
      padding: "18px 12px",
      gap: 6,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 16px" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.bg2,
        }}
      >
        <OwlMark size={22} color={theme.text} />
      </div>
      <span style={{ fontFamily: fonts.sans, fontSize: 22, fontWeight: 650, color: theme.text }}>otto</span>
    </div>
    {NAV.map((item) => {
      const on = item.id === active;
      return (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: on ? theme.bg : "transparent",
            border: on ? `1px solid ${theme.border}` : "1px solid transparent",
            fontFamily: fonts.sans,
            fontSize: 18,
            fontWeight: on ? 600 : 500,
            color: on ? theme.text : theme.textDim,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: on ? theme.text : theme.borderStrong,
            }}
          />
          {item.label}
        </div>
      );
    })}
  </div>
);

const ChatPane: React.FC<{ highlightComposer?: boolean }> = ({ highlightComposer }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", background: theme.bg2 }}>
    <div
      style={{
        height: 52,
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        fontFamily: fonts.mono,
        fontSize: 16,
        color: theme.textFaint,
        letterSpacing: 1,
      }}
    >
      COMMAND STATION
    </div>
    <div style={{ flex: 1, padding: "48px 64px", maxWidth: 760 }}>
      <div style={{ fontFamily: fonts.mono, fontSize: 14, letterSpacing: 6, color: theme.textFaint, textTransform: "uppercase" }}>
        {EMPTY.chat.eyebrow}
      </div>
      <div style={{ fontFamily: fonts.sans, fontSize: 34, fontWeight: 650, color: theme.text, marginTop: 16, lineHeight: 1.25 }}>
        {EMPTY.chat.title}
      </div>
      <div style={{ fontFamily: fonts.sans, fontSize: 20, color: theme.textDim, marginTop: 16, lineHeight: 1.5 }}>
        {EMPTY.chat.body}
      </div>
    </div>
    <div style={{ padding: "0 32px 28px" }}>
      <div
        style={{
          border: `1px solid ${highlightComposer ? theme.text : theme.border}`,
          borderRadius: 14,
          background: theme.panel,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: highlightComposer ? "0 8px 28px rgba(16,17,20,0.08)" : "none",
        }}
      >
        <span style={{ fontFamily: fonts.sans, fontSize: 18, color: theme.textFaint, flex: 1 }}>Message otto…</span>
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 13,
            color: theme.textFaint,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "6px 10px",
          }}
        >
          ↵ send
        </span>
      </div>
    </div>
  </div>
);

const EmptyPane: React.FC<{ surface: MockSurface }> = ({ surface }) => {
  const c = EMPTY[surface];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: theme.bg2 }}>
      <div
        style={{
          height: 52,
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          fontFamily: fonts.mono,
          fontSize: 16,
          color: theme.textFaint,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {c.eyebrow}
      </div>
      <div style={{ flex: 1, padding: "56px 64px", maxWidth: 720 }}>
        <div style={{ fontFamily: fonts.sans, fontSize: 32, fontWeight: 650, color: theme.text, lineHeight: 1.25 }}>
          {c.title}
        </div>
        <div style={{ fontFamily: fonts.sans, fontSize: 20, color: theme.textDim, marginTop: 16, lineHeight: 1.5 }}>
          {c.body}
        </div>
        {c.path ? (
          <div
            style={{
              marginTop: 24,
              fontFamily: fonts.mono,
              fontSize: 16,
              color: theme.textFaint,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: "10px 14px",
              display: "inline-block",
            }}
          >
            {c.path}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const OttoShellMock: React.FC<{
  surface: MockSurface;
  highlightComposer?: boolean;
  delay?: number;
  width?: number;
}> = ({ surface, highlightComposer, delay = 0, width = 1320 }) => {
  const e = useOttoEnter(delay);
  const scale = ottoScale(e);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: e,
          transform: `scale(${scale})`,
          width,
          borderRadius: 16,
          overflow: "hidden",
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 24px 70px rgba(16,17,20,0.10)",
        }}
      >
        <div
          style={{
            height: 48,
            background: theme.panelBar,
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            gap: 8,
          }}
        >
          <Dot c={theme.tlRed} />
          <Dot c={theme.tlYellow} />
          <Dot c={theme.tlGreen} />
          <div style={{ flex: 1, textAlign: "center", fontFamily: fonts.mono, fontSize: 16, color: theme.textFaint }}>
            otto
          </div>
          <div style={{ width: 48 }} />
        </div>
        <div style={{ display: "flex", height: 620 }}>
          <Sidebar active={surface} />
          {surface === "chat" ? (
            <ChatPane highlightComposer={highlightComposer} />
          ) : (
            <EmptyPane surface={surface} />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
