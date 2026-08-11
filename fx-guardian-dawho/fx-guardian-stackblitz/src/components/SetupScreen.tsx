import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import type { CurrencyCode, FxDatabase, FxOrder, TravelFxHandoff } from "../types/fx";

const fmt = (n: number, d = 0) => n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

const CCY_LABEL: Record<string, string> = { USD: "美元", JPY: "日圓", CNY: "人民幣" };
const CCY_FLAG: Record<string, string> = { USD: "🇺🇸", JPY: "🇯🇵", CNY: "🇨🇳" };

const MODE_HINT: Record<1 | 2 | 3, string> = {
  1: "只填了目標匯率：達到（或優於）這個價位，換匯守衛將授權即執行。",
  2: "只填了時間區間：這段期間內由 AI 擇相對低點主動建議；到期仍未換，將以當日匯率保證完成。",
  3: "同時填了目標匯率與時間區間：達門檻但區間未到期時，AI 只會示警建議，是否鎖定由您決定；到期保證完成。",
};

export function SetupScreen({ db, onSave, go, prefill }: { db: FxDatabase; onSave: (order: FxOrder) => void; go: (s: string) => void; prefill?: TravelFxHandoff | null }) {
  const ccyOptions = Object.keys(db.fxRates);
  const [ccy, setCcy] = useState<CurrencyCode>(prefill?.targetCcy ?? ccyOptions[0] ?? "USD");
  const [amount, setAmount] = useState("");
  const [fxAmount, setFxAmount] = useState(prefill ? String(prefill.suggestedAmountForeign) : "");
  const [targetRate, setTargetRate] = useState("");
  const [windowStart, setWindowStart] = useState(prefill?.windowStart ?? "");
  const [windowEnd, setWindowEnd] = useState(prefill?.windowEnd ?? "");
  const [note, setNote] = useState(prefill?.note ?? "");
  const [error, setError] = useState("");

  const rate = db.fxRates[ccy];
  const ccyLabel = CCY_LABEL[ccy] ?? ccy;
  const hasTwdAmt = amount.trim() !== "";
  const hasFxAmt = fxAmount.trim() !== "";
  const hasTarget = targetRate.trim() !== "";
  const hasWindow = windowStart.trim() !== "" && windowEnd.trim() !== "";
  const mode: 1 | 2 | 3 | null = hasTarget && hasWindow ? 3 : hasTarget ? 1 : hasWindow ? 2 : null;

  function submit() {
    if (!hasTwdAmt && !hasFxAmt) return setError(`請擇一填寫「臺幣金額」或「${ccyLabel}金額」。`);
    // 兩個金額欄互為擇一：填了台幣就照台幣算，只填外幣就用目前買入價換算成台幣金額；
    // 兩個都填的話以台幣金額為準（見下方欄位間的提示文字）。
    let amt: number;
    if (hasTwdAmt) {
      amt = Number(amount);
      if (!amt || amt <= 0) return setError("臺幣金額請輸入大於 0 的數字。");
    } else {
      const fxAmt = Number(fxAmount);
      if (!fxAmt || fxAmt <= 0) return setError(`${ccyLabel}金額請輸入大於 0 的數字。`);
      amt = Math.round(fxAmt * rate.bank_sell);
    }
    if (!mode) return setError("請至少填寫「目標匯率」或「時間區間」其中一項，換匯守衛才知道何時該幫您留意。");
    if (hasWindow && windowStart > windowEnd) return setError("時間區間的結束日期不能早於開始日期。");
    setError("");
    onSave({
      pair: `TWD→${ccy}`,
      target_ccy: ccy,
      amount_twd: amt,
      mode,
      targetRate: hasTarget ? Number(targetRate) : undefined,
      // 這個 app 目前只做「用台幣換外幣」，買入價永遠是「越低」才對客戶有利，
      // 門檻方向固定是 below，不開放使用者選（見 types/fx.ts 的 TargetDirection 說明）。
      targetDirection: hasTarget ? "below" : undefined,
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

      {prefill && (
        <div style={{ margin: "10px 18px 0", background: "#fbf2df", border: `1px solid ${C.goldDeep}`, borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: "#6a5a30", lineHeight: 1.6 }}>
          已帶入旅遊支出小助手的建議金額與觀察區間，請確認後送出。
        </div>
      )}

      {/* currency */}
      <div style={{ padding: "18px 18px 0" }}>
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
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 4 }}>我要用多少臺幣換</div>
        <div style={{ fontSize: 12.5, color: C.lightDim, marginBottom: 10 }}>「臺幣金額」與「{ccyLabel}金額」擇一必填即可，兩者都填以臺幣金額為準</div>
        <div style={{ border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", alignItems: "center" }}>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="例如 1000000"
            style={{ border: "none", outline: "none", flex: 1, fontSize: 17, fontWeight: 700, color: C.lightInk, background: "transparent" }} />
          <span style={{ color: C.lightDim }}>TWD</span>
        </div>
        <div style={{ textAlign: "center", color: C.lightDim, fontSize: 12.5, padding: "8px 0" }}>或</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>我想換多少{ccyLabel}</div>
        <div style={{ border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", alignItems: "center" }}>
          <input value={fxAmount} onChange={e => setFxAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={`例如 ${rate ? fmt(Math.round(1000000 / rate.bank_sell)) : ""}`}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 17, fontWeight: 700, color: C.lightInk, background: "transparent" }} />
          <span style={{ color: C.lightDim }}>{ccyLabel}</span>
        </div>
      </div>

      {/* target rate */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>目標匯率（選填）</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{
            flex: 1, border: `1px solid ${C.goldDeep}`, borderRadius: 10, padding: "10px 0", textAlign: "center",
            background: "#fbf2df", color: C.goldDeep, fontSize: 14, fontWeight: 700,
          }}>低於（含）</div>
        </div>
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
