import type { CSSProperties } from "react";

// ============================================================
//  THEME — dark charcoal + gold, marble deposit card.
//  Built from the user's own mockups. Tune tokens here.
// ============================================================
export const C = {
  bg: "#2A2A2E",        // app charcoal background
  bgDeep: "#1E1E22",
  card: "#33333A",
  cardHi: "#3C3C44",
  gold: "#C9A15A",      // primary gold
  goldLt: "#E4C77E",
  goldDeep: "#A8843F",
  marble1: "#F3F1EC",   // marble card light
  marble2: "#E4E0D8",
  ink: "#1A1A1E",
  text: "#F2F1EE",
  textDim: "#9A9AA2",
  line: "#45454E",
  green: "#4ADE80",
  red: "#E8604C",       // rate chart red
  redSoft: "#D9705F",
  white: "#FFFFFF",
  lightBg: "#F5F3EF",   // light screens (trend / exchange)
  lightCard: "#FFFFFF",
  lightInk: "#2A2A2E",
  lightDim: "#8A8A90",
  lightLine: "#E2DED6",
};

type S = Record<string, CSSProperties>;

export const styles: S = {
  viewport: {
    minHeight: "100vh",
    background: "#0d0d0f",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "20px 12px",
    fontFamily: "'Noto Sans TC','PingFang TC',system-ui,sans-serif",
  },
  phone: {
    width: 390, height: 800, background: C.bg, borderRadius: 42, overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.05)",
    display: "flex", flexDirection: "column", position: "relative",
  },
  footnote: { color: "#666", fontSize: 12, marginTop: 14, letterSpacing: .3 },

  statusBar: {
    height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", fontSize: 13, fontWeight: 600, color: C.text, flexShrink: 0,
  },
  screen: { flex: 1, overflowY: "auto", position: "relative" },

  tabBar: {
    height: 74, background: C.bgDeep, borderTop: `1px solid ${C.line}`,
    display: "flex", alignItems: "center", justifyContent: "space-around",
    padding: "0 6px 12px", flexShrink: 0,
  },
  tabItem: {
    background: "none", border: "none", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1,
  },
  tabLabel: { fontSize: 11, fontWeight: 500 },
};
