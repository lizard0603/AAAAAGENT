import { useMemo, useState } from "react";
import { C, styles as S } from "./styles/theme";
import { mockDb } from "./data/mockDb";
import { detectOpportunity } from "./agent/opportunity";
import { Icon, P, SignalBars, BatteryGlyph } from "./components/icons";
import { HomeScreen } from "./components/HomeScreen";
import { TrendScreen } from "./components/TrendScreen";
import { ExchangeScreen, DoneScreen } from "./components/ExchangeScreen";
import { AgentScreen } from "./components/AgentScreen";

type Screen = "home" | "trend" | "exchange" | "done" | "agent";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const db = mockDb;
  const opp = useMemo(() => detectOpportunity(db), [db]);
  const go = (s: string) => setScreen(s as Screen);

  const TABS = [
    { id: "home", label: "首頁", d: P.home },
    { id: "trend", label: "投資", d: P.chart },
    { id: "agent", label: "常用", d: P.shield, center: true },
    { id: "trend2", label: "等級", d: P.star },
    { id: "more", label: "更多", d: P.grid },
  ];

  return (
    <div style={S.viewport}>
      <div style={S.phone}>
        <div style={S.statusBar}>
          <span>10:15</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SignalBars color={C.text} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>5G</span>
            <BatteryGlyph color={C.text} level={0.85} />
          </div>
        </div>

        <div style={S.screen}>
          {screen === "home" && <HomeScreen db={db} opp={opp} go={go} />}
          {screen === "trend" && <TrendScreen db={db} opp={opp} go={go} />}
          {screen === "exchange" && <ExchangeScreen db={db} opp={opp} go={go} />}
          {screen === "done" && <DoneScreen db={db} go={go} />}
          {screen === "agent" && <AgentScreen db={db} opp={opp} go={go} />}
        </div>

        <div style={S.tabBar}>
          {TABS.map((t) => {
            const active = screen === t.id || (t.id === "home" && ["exchange","done"].includes(screen));
            if (t.center) {
              return (
                <button key={t.id} onClick={() => go(t.id)} style={S.tabItem}>
                  <div style={{ width: 46, height: 46, borderRadius: 23, marginTop: -18,
                    background: `linear-gradient(135deg,${C.goldDeep},${C.goldLt})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: opp.state !== "none" ? `0 0 0 3px rgba(74,222,128,.4)` : "0 4px 12px rgba(0,0,0,.4)", position: "relative" }}>
                    <Icon d={P.shield} size={22} color={C.ink} />
                    {opp.state !== "none" && <span style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, background: C.green, border: `2px solid ${C.bgDeep}` }} />}
                  </div>
                  <span style={{ ...S.tabLabel, color: active ? C.goldLt : C.textDim, marginTop: 2 }}>{t.label}</span>
                </button>
              );
            }
            return (
              <button key={t.id} onClick={() => go(t.id === "trend2" ? "trend" : t.id)} style={S.tabItem}>
                <Icon d={t.d} size={22} color={active ? C.goldLt : C.textDim} />
                <span style={{ ...S.tabLabel, color: active ? C.goldLt : C.textDim }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p style={S.footnote}>原型展示 · DAWHO 換匯守衛 POC · 免金鑰示範模式</p>
    </div>
  );
}
