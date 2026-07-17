import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import type { CurrencyCode, FxDatabase, FxOrder } from "../types/fx";

const fmt = (n: number, d = 0) => n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

const CCY_LABEL: Record<string, string> = { USD: "美元", JPY: "日圓", CNY: "人民幣" };
const CCY_FLAG: Record<string, string> = { USD: "🇺🇸", JPY: "🇯🇵", CNY: "🇨🇳" };

const MODE_HINT: Record<1 | 2 | 3, string> = {
  1: "只填了目標匯率：達到（或優於）這個價位，換匯守衛將授權即執行。",
  2: "只填了時間區間：這段期間內由 AI 擇相對低點主動建議；到期仍未換，將以當日匯率保證完成。",
  3: "同時填了目標匯率與時間區間：達門檻但區間未到期時，AI 只會示警建議，是否鎖定由您決定；到期保證完成。",
};

// Preset scenarios so you can preview every UI state without hand-tuning
// numbers against today's mock rates. Tuned against mockDb: USD bank_sell
// 32.211 / ma20 32.02, JPY bank_sell 0.2015 / ma20 0.2038, today 2026-07-15.
type ScenarioState = "none" | "advise" | "execute";
const STATE_BADGE: Record<ScenarioState, { label: string; bg: string; fg: string }> = {
  none: { label: "監控中", bg: "#eceae4", fg: "#6a6a70" },
  advise: { label: "示警建議", bg: "#fbf2df", fg: "#a8843f" },
  execute: { label: "授權執行", bg: "#eafaf0", fg: "#1a7a45" },
};
const SCENARIOS: { group: string; label: string; state: ScenarioState; order: FxOrder }[] = [
  { group: "模式一 · 觸價執行", label: "尚未達門檻", state: "none",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 1, targetRate: 32.0 } },
  { group: "模式一 · 觸價執行", label: "已達門檻，授權即執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 1, targetRate: 32.25 } },
  { group: "模式二 · 區間找低點", label: "AI 找到相對低點，建議換匯", state: "advise",
    order: { pair: "TWD→JPY", target_ccy: "JPY", amount_twd: 1000000, mode: 2, window_start: "2026-07-01", window_end: "2026-07-31" } },
  { group: "模式二 · 區間找低點", label: "區間到期，保底執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 2, window_start: "2026-07-01", window_end: "2026-07-10" } },
  { group: "模式三 · 門檻＋區間", label: "未觸價、區間未到期", state: "none",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.0, window_start: "2026-07-01", window_end: "2026-07-31" } },
  { group: "模式三 · 門檻＋區間", label: "已觸價但區間未到期，示警建議", state: "advise",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.25, window_start: "2026-07-01", window_end: "2026-07-31" } },
  { group: "模式三 · 門檻＋區間", label: "已觸價且區間到期，執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.25, window_start: "2026-07-01", window_end: "2026-07-10" } },
  { group: "模式三 · 門檻＋區間", label: "未觸價但區間到期，保底執行", state: "execute",
    order: { pair: "TWD→USD", target_ccy: "USD", amount_twd: 1000000, mode: 3, targetRate: 32.0, window_start: "2026-07-01", window_end: "2026-07-10" } },
];

export function SetupScreen({ db, onSave, go }: { db: FxDatabase; onSave: (order: FxOrder) => void; go: (s: string) => void }) {
  const ccyOptions = Object.keys(db.fxRates);
  const [ccy, setCcy] = useState<CurrencyCode>(ccyOptions[0] ?? "USD");
  const [amount, setAmount] = useState("");
  const [targetRate, setTargetRate] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const rate = db.fxRates[ccy];
  const hasTarget = targetRate.trim() !== "";
  const hasWindow = windowStart.trim() !== "" && windowEnd.trim() !== "";
  const mode: 1 | 2 | 3 | null = hasTarget && hasWindow ? 3 : hasTarget ? 1 : hasWindow ? 2 : null;

  function submit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("請輸入要換匯的臺幣金額。");
    if (!mode) return setError("請至少填寫「目標匯率」或「時間區間」其中一項，換匯守衛才知道何時該幫您留意。");
    if (hasWindow && windowStart > windowEnd) return setError("時間區間的結束日期不能早於開始日期。");
    setError("");
    onSave({
      pair: `TWD→${ccy}`,
      target_ccy: ccy,
      amount_twd: amt,
      mode,
      targetRate: hasTarget ? Number(targetRate) : undefined,
      window_start: hasWindow ? windowStart : undefined,
      window_end: hasWindow ? windowEnd : undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px" }}>
        <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: C.lightInk }}>設定換匯守衛</span>
        <span style={{ width: 26 }} />
      </div>

      <div style={{ margin: "6px 18px 0", background: "linear-gradient(100deg,#eafaf0,#dff5e8)", border: `1px solid ${C.green}`, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10 }}>
        <Icon d={P.shield} size={20} color="#22A85A" />
        <div style={{ fontSize: 12.5, color: "#1a7a45", lineHeight: 1.6 }}>
          告訴換匯守衛您想要的條件，之後它會依這些條件幫您監控匯率、在對的時機通知或執行換匯。
        </div>
      </div>

      {/* quick preview scenarios */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 4 }}>快速預覽情境</div>
        <div style={{ fontSize: 12.5, color: C.lightDim, marginBottom: 12 }}>直接套用預先設好的條件，馬上看到對應畫面（Demo 用）</div>
        {Object.entries(
          SCENARIOS.reduce<Record<string, typeof SCENARIOS>>((acc, s) => {
            (acc[s.group] ??= []).push(s);
            return acc;
          }, {})
        ).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{group}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((s, i) => {
                const badge = STATE_BADGE[s.state];
                return (
                  <button key={i} onClick={() => onSave(s.order)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                    border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "12px 14px",
                    background: "#fff", cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ fontSize: 13.5, color: C.lightInk, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, borderRadius: 8, padding: "3px 9px", background: badge.bg, color: badge.fg }}>{badge.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ margin: "8px 18px 0", height: 1, background: C.lightLine }} />
      <div style={{ padding: "18px 18px 0", fontSize: 14, color: C.lightDim, fontWeight: 600 }}>或自己手動設定</div>

      {/* currency */}
      <div style={{ padding: "10px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>要換的幣別</div>
        <div style={{ display: "flex", gap: 10 }}>
          {ccyOptions.map(c => (
            <button key={c} onClick={() => setCcy(c)} style={{
              flex: 1, border: `1px solid ${c === ccy ? C.goldDeep : C.lightLine}`, borderRadius: 10, padding: "12px 0",
              background: c === ccy ? "#fbf2df" : "#fff", cursor: "pointer",
              color: c === ccy ? C.goldDeep : C.lightInk, fontSize: 15, fontWeight: 700,
            }}>{CCY_FLAG[c] ?? "💱"} {CCY_LABEL[c] ?? c}</button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12.5, color: C.lightDim }}>目前 {CCY_LABEL[ccy] ?? ccy} 買入價 {rate?.bank_sell}，20 日均價 {rate?.ma20}</div>
      </div>

      {/* amount */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>我要用多少臺幣換</div>
        <div style={{ border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", alignItems: "center" }}>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="例如 1000000"
            style={{ border: "none", outline: "none", flex: 1, fontSize: 17, fontWeight: 700, color: C.lightInk, background: "transparent" }} />
          <span style={{ color: C.lightDim }}>TWD</span>
        </div>
      </div>

      {/* target rate */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 4 }}>目標匯率（選填）</div>
        <div style={{ fontSize: 12.5, color: C.lightDim, marginBottom: 10 }}>達到這個買入價（或更低）就符合您的條件</div>
        <div style={{ border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", alignItems: "center" }}>
          <input value={targetRate} onChange={e => setTargetRate(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={`例如 ${rate?.ma20}`}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 17, fontWeight: 700, color: C.lightInk, background: "transparent" }} />
          <span style={{ color: C.lightDim }}>/ {CCY_LABEL[ccy] ?? ccy}</span>
        </div>
      </div>

      {/* window */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 4 }}>觀察時間區間（選填）</div>
        <div style={{ fontSize: 12.5, color: C.lightDim, marginBottom: 10 }}>這段期間內由換匯守衛幫您找相對低點；到期仍保證完成</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
            <div style={{ fontSize: 11, color: C.lightDim, marginBottom: 4 }}>開始</div>
            <input type="date" value={windowStart} onChange={e => setWindowStart(e.target.value)}
              style={{ border: "none", outline: "none", width: "100%", fontSize: 14, color: C.lightInk, background: "transparent" }} />
          </div>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
            <div style={{ fontSize: 11, color: C.lightDim, marginBottom: 4 }}>結束</div>
            <input type="date" value={windowEnd} onChange={e => setWindowEnd(e.target.value)}
              style={{ border: "none", outline: "none", width: "100%", fontSize: 14, color: C.lightInk, background: "transparent" }} />
          </div>
        </div>
      </div>

      {/* note */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>備註（選填）</div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="例如：小孩下學期美國學費，想趁低點換"
          style={{ width: "100%", border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", fontSize: 14, color: C.lightInk, outline: "none" }} />
      </div>

      {/* mode preview */}
      {mode && (
        <div style={{ margin: "18px 18px 0", background: "#fbf2df", border: `1px solid ${C.gold}`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.goldDeep, marginBottom: 4 }}>
            {mode === 1 ? "模式一 · 觸價執行" : mode === 2 ? "模式二 · 區間找低點" : "模式三 · 門檻＋區間"}
          </div>
          <div style={{ fontSize: 12, color: "#6a5a30", lineHeight: 1.6 }}>{MODE_HINT[mode]}</div>
        </div>
      )}

      {error && (
        <div style={{ margin: "14px 18px 0", color: C.red, fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}

      <div style={{ padding: "20px 18px 26px" }}>
        <button onClick={submit} style={{
          width: "100%", border: "none", borderRadius: 10, padding: "16px 0", fontSize: 18, fontWeight: 800, cursor: "pointer",
          background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink,
        }}>開始監控</button>
      </div>
    </div>
  );
}
