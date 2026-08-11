import { useMemo, useState } from "react";
import { C, styles as S } from "./styles/theme";
import { mockDb } from "./data/mockDb";
import { detectOpportunity } from "./agent/opportunity";
import { Icon, P, SignalBars, BatteryGlyph } from "./components/icons";
import { HomeScreen } from "./components/HomeScreen";
import { TrendScreen } from "./components/TrendScreen";
import { ExchangeScreen, ConfirmScreen, DoneScreen } from "./components/ExchangeScreen";
import { AgentScreen } from "./components/AgentScreen";
import { SetupScreen } from "./components/SetupScreen";
import { CardScreen } from "./components/CardScreen";
import { TravelAgentScreen } from "./components/TravelAgentScreen";
import { DevScenarioPanel } from "./components/DevScenarioPanel";
import type { FxOrder, PendingExchange, TravelFxHandoff } from "./types/fx";

type Screen = "home" | "trend" | "exchange" | "confirm" | "done" | "agent" | "setup" | "card" | "travelAgent";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [fxWatch, setFxWatch] = useState<FxOrder[]>(mockDb.fxWatch);
  const [activeIdx, setActiveIdx] = useState(0);
  // 「填寫資料」送出的那筆報價快照，「再次確認」跟「交易結果」都靠這個顯示，
  // 不會在畫面之間重新用當下的 db.fxRates 反推（見 types/fx.ts 的 PendingExchange 說明）。
  const [pendingExchange, setPendingExchange] = useState<PendingExchange | null>(null);
  // 旅遊支出小助手「前往換匯守衛設定」帶過來的預填資料，SetupScreen 用它預填
  // 幣別／金額／觀察區間。只在透過 handoffToGuardian 進入 setup 時才有值——
  // 其他管道（頂部導覽、「新增一筆」等）進 setup 一律由 go() 清空，避免殘留舊建議。
  const [setupPrefill, setSetupPrefill] = useState<TravelFxHandoff | null>(null);
  const db = useMemo(() => ({ ...mockDb, fxWatch }), [fxWatch]);
  // Per-order opportunity states — the customer can have more than one order watched at once.
  const opps = useMemo(() => fxWatch.map(order => detectOpportunity({ ...mockDb, fxWatch: [order] })), [fxWatch]);
  // "Primary" opportunity for Home/Trend/Exchange screens: the most urgent order, else the first.
  const opp = useMemo(
    () => opps.find(o => o.state === "execute") ?? opps.find(o => o.state === "advise") ?? opps[0] ?? detectOpportunity({ ...mockDb, fxWatch: [] }),
    [opps]
  );
  const clampedIdx = Math.min(activeIdx, Math.max(fxWatch.length - 1, 0));
  const activeDb = useMemo(() => ({ ...mockDb, fxWatch: fxWatch[clampedIdx] ? [fxWatch[clampedIdx]] : [] }), [fxWatch, clampedIdx]);
  const activeOpp = opps[clampedIdx] ?? detectOpportunity({ ...mockDb, fxWatch: [] });
  // "agent" (the monitoring/chat screen) requires a configured order first.
  const go = (s: string) => {
    setSetupPrefill(null);
    setScreen(s === "agent" && fxWatch.length === 0 ? "setup" : (s as Screen));
  };
  const handoffToGuardian = (handoff: TravelFxHandoff) => {
    setSetupPrefill(handoff);
    setScreen("setup");
  };
  const saveOrder = (order: FxOrder) => {
    const next = [...fxWatch, order];
    setFxWatch(next);
    setActiveIdx(next.length - 1);
    setScreen("agent");
  };
  const cancelOrder = (idx: number) => {
    const next = fxWatch.filter((_, i) => i !== idx);
    setFxWatch(next);
    setActiveIdx(0);
    if (next.length === 0) setScreen("home");
  };

  const TABS = [
    { id: "home", label: "首頁", d: P.home },
    { id: "trend", label: "投資", d: P.chart },
    { id: "agent", label: "常用", d: P.shield, center: true },
    { id: "trend2", label: "等級", d: P.star },
    { id: "more", label: "更多", d: P.grid },
  ];

  return (
    <div className="app-viewport" style={S.viewport}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div className="phone-frame" style={S.phone}>
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
            {screen === "exchange" && (
              <ExchangeScreen db={db} opp={opp} go={go} onConfirm={(p) => { setPendingExchange(p); setScreen("confirm"); }} />
            )}
            {screen === "confirm" && pendingExchange && (
              <ConfirmScreen db={db} pending={pendingExchange} go={go} onSubmit={() => setScreen("done")} />
            )}
            {screen === "done" && <DoneScreen db={db} go={go} pending={pendingExchange} />}
            {screen === "agent" && (
              <AgentScreen
                db={activeDb}
                opp={activeOpp}
                go={go}
                orders={fxWatch}
                activeIdx={clampedIdx}
                onSwitchOrder={setActiveIdx}
                onCancelOrder={() => cancelOrder(clampedIdx)}
                onAddAnother={() => go("setup")}
              />
            )}
            {screen === "setup" && <SetupScreen db={db} onSave={saveOrder} go={go} prefill={setupPrefill} />}
            {screen === "card" && <CardScreen db={db} go={go} />}
            {screen === "travelAgent" && <TravelAgentScreen db={db} go={go} onHandoff={handoffToGuardian} />}
          </div>

          <div style={S.tabBar}>
            {TABS.map((t) => {
              const active = screen === t.id || (t.id === "home" && ["exchange","confirm","done","card","travelAgent"].includes(screen)) || (t.id === "agent" && screen === "setup");
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

        <DevScenarioPanel
          orderCount={fxWatch.length}
          onApply={saveOrder}
          onReset={() => { setFxWatch([]); setActiveIdx(0); setScreen("home"); }}
        />
      </div>
      <p className="dev-panel" style={S.footnote}>原型展示 · DAWHO 換匯守衛 POC · 免金鑰示範模式</p>
    </div>
  );
}
