import type { FxOrder } from "../types/fx";

// ============================================================
//  Dev-only scenario picker — lives OUTSIDE the phone mockup.
//  This is a demo/testing tool, not part of the DAWHO app UI a
//  real customer would see. It jumps straight into any of the
//  opportunity states by directly appending a crafted FxOrder,
//  instead of hand-tuning target rate/window values in the app.
//  Tuned against mockDb: USD bank_sell 32.211 / ma20 32.02,
//  JPY bank_sell 0.2015 / ma20 0.2038, today 2026-07-15.
// ============================================================

type ScenarioState = "none" | "advise" | "execute";
const STATE_BADGE: Record<ScenarioState, { label: string; bg: string; fg: string }> = {
  none: { label: "監控中", bg: "#3a3a42", fg: "#c7c7cf" },
  advise: { label: "示警建議", bg: "#4a3f1f", fg: "#e8c97a" },
  execute: { label: "授權執行", bg: "#1e3d2c", fg: "#5fd894" },
};

const SCENARIOS: { group: string; label: string; state: ScenarioState; order: FxOrder }[] = [
  { group: "到價自動換", label: "尚未達門檻", state: "none",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 1, targetRate: 32.0 } },
  { group: "到價自動換", label: "已達門檻，授權即執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 1, targetRate: 32.25 } },
  { group: "區間找低點", label: "AI 找到相對低點，建議換匯", state: "advise",
    order: { pair: "TWD→JPY", target_ccy: "JPY", amount_twd: 1000000, mode: 2, window_start: "2026-07-01", window_end: "2026-07-31" } },
  { group: "區間找低點", label: "區間到期，保底執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 2, window_start: "2026-07-01", window_end: "2026-07-10" } },
  { group: "智能提醒", label: "未觸價、區間未到期", state: "none",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.0, window_start: "2026-07-01", window_end: "2026-07-31" } },
  { group: "智能提醒", label: "已觸價但區間未到期，示警建議", state: "advise",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.25, window_start: "2026-07-01", window_end: "2026-07-31" } },
  { group: "智能提醒", label: "已觸價且區間到期，執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.25, window_start: "2026-07-01", window_end: "2026-07-10" } },
  { group: "智能提醒", label: "未觸價但區間到期，保底執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.0, window_start: "2026-07-01", window_end: "2026-07-10" } },
];

const GROUPS = Array.from(new Set(SCENARIOS.map(s => s.group))).map(group => ({
  group,
  items: SCENARIOS.filter(s => s.group === group),
}));

export function DevScenarioPanel({ orderCount, onApply, onReset, onViewTripReport }: {
  orderCount: number;
  onApply: (order: FxOrder) => void;
  onReset: () => void;
  onViewTripReport: () => void;
}) {
  return (
    <div style={{
      width: 280, maxHeight: 800, overflowY: "auto", background: "#17171b",
      border: "1px solid #2c2c33", borderRadius: 16, padding: "18px 16px", flexShrink: 0,
    }}>
      <div style={{ color: "#e8c97a", fontSize: 13, fontWeight: 800, marginBottom: 2 }}>🛠 Demo 控制台</div>
      <div style={{ color: "#7a7a84", fontSize: 11, lineHeight: 1.5, marginBottom: 16 }}>
        不屬於手機畫面 — 點一下直接套用條件、跳進對應狀態，方便快速預覽每種情境。
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ color: "#c7c7cf", fontSize: 12 }}>目前已設定 {orderCount} 筆委託</span>
        <button onClick={onReset} disabled={orderCount === 0} style={{
          background: "none", border: "1px solid #45454e", borderRadius: 8, padding: "4px 10px",
          color: orderCount === 0 ? "#55555e" : "#e8896a", fontSize: 11, fontWeight: 700,
          cursor: orderCount === 0 ? "default" : "pointer",
        }}>清空全部</button>
      </div>

      {GROUPS.map(({ group, items }) => (
        <div key={group} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#c9a15a", marginBottom: 6 }}>{group}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((s, i) => {
              const badge = STATE_BADGE[s.state];
              return (
                <button key={i} onClick={() => onApply(s.order)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  border: "1px solid #2c2c33", borderRadius: 9, padding: "9px 11px",
                  background: "#1e1e23", cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ fontSize: 12, color: "#e6e6ea", fontWeight: 600 }}>{s.label}</span>
                  <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: "2px 8px", background: badge.bg, color: badge.fg }}>{badge.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: "#c9a15a", marginBottom: 6 }}>旅遊收支報告</div>
        <button onClick={onViewTripReport} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          border: "1px solid #2c2c33", borderRadius: 9, padding: "9px 11px",
          background: "#1e1e23", cursor: "pointer", textAlign: "left",
        }}>
          <span style={{ fontSize: 12, color: "#e6e6ea", fontWeight: 600 }}>模擬：旅遊已結束，首頁出現收支報告</span>
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: "2px 8px", background: "#3a3a42", color: "#c7c7cf" }}>套用情境</span>
        </button>
      </div>
    </div>
  );
}
