import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { CCY_LABEL, CCY_FLAG } from "../data/currencies";
import { COMMON_PURPOSES, OTHER_PURPOSES, DEFAULT_SETTLEMENT_PURPOSE } from "../data/settlementPurpose";
import { CurrencyPicker } from "./CurrencyPicker";
import { PurposePicker } from "./PurposePicker";
import type { CurrencyCode, FxDatabase, FxOrder, TravelFxHandoff } from "../types/fx";

const fmt = (n: number, d = 0) => n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

const MODE_HINT: Record<1 | 2 | 3, string> = {
  1: "只填了目標匯率：達到（或優於）這個價位，換匯守衛將授權即執行。",
  2: "只填了時間區間：這段期間內由 AI 擇相對低點主動建議；到期仍未換，將以當日匯率保證完成。",
  3: "同時填了目標匯率與時間區間：達門檻但區間未到期時，AI 只會示警建議，是否鎖定由您決定；到期保證完成。",
};

export function SetupScreen({ db, onSave, go, prefill }: { db: FxDatabase; onSave: (order: FxOrder) => void; go: (s: string) => void; prefill?: TravelFxHandoff | null }) {
  const ccyOptions = Object.keys(db.fxRates);
  // 沒有預填資料（不是從旅遊小助手帶過來）時，預設幣別固定用日圓——
  // 換日圓是這個 demo 情境裡最常見的換匯需求。
  const [ccy, setCcy] = useState<CurrencyCode>(prefill?.targetCcy ?? (db.fxRates.JPY ? "JPY" : ccyOptions[0] ?? "USD"));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [fxAmount, setFxAmount] = useState(prefill ? String(prefill.suggestedAmountForeign) : "");
  const [targetRate, setTargetRate] = useState("");
  const [windowStart, setWindowStart] = useState(prefill?.windowStart ?? "");
  const [windowEnd, setWindowEnd] = useState(prefill?.windowEnd ?? "");
  const [note, setNote] = useState(prefill?.note ?? "");
  // 結匯性質——先在這裡填好，換匯頁／再次確認頁直接沿用，不用重填一次
  // （見 types/fx.ts FxOrder.settlementPurpose 的說明）。比照永豐實際換匯頁：
  // 先選「常用」或「其他」申報性質，再從對應清單挑一項；切換分類會清空目前的選擇。
  const [purposeCategory, setPurposeCategory] = useState<"common" | "other">("common");
  const [purpose, setPurpose] = useState(prefill?.settlementPurpose ?? DEFAULT_SETTLEMENT_PURPOSE);
  const [purposePickerOpen, setPurposePickerOpen] = useState(false);
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
    if (!purpose) return setError("請選擇結匯性質。");
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
      settlementPurpose: purpose,
    });
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg, position: "relative" }}>
      {pickerOpen && (
        <CurrencyPicker title="要換的幣別" value={ccy} onSelect={setCcy} onClose={() => setPickerOpen(false)} />
      )}
      {purposePickerOpen && (
        <PurposePicker
          title={purposeCategory === "common" ? "常用申報性質" : "申報細項"}
          options={purposeCategory === "common" ? COMMON_PURPOSES : OTHER_PURPOSES}
          value={purpose}
          onSelect={setPurpose}
          onClose={() => setPurposePickerOpen(false)}
        />
      )}
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
          已帶入旅遊小助手的建議金額與觀察區間，請確認後送出。
        </div>
      )}

      {/* currency — 可點擊調整，涵蓋永豐承作的全部幣別（見 CurrencyPicker） */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>要換的幣別</div>
        <div onClick={() => setPickerOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          border: `1px solid ${C.goldDeep}`, borderRadius: 10, padding: "13px 14px", background: "#fbf2df",
        }}>
          <span style={{ fontSize: 20 }}>{CCY_FLAG[ccy] ?? "💱"}</span>
          <span style={{ flex: 1, color: C.goldDeep, fontSize: 16, fontWeight: 700 }}>{CCY_LABEL[ccy] ?? ccy}</span>
          <Icon d={P.chevDown} size={14} color={C.goldDeep} />
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

      {/* 結匯性質——比照永豐實際換匯頁：先選常用／其他申報性質，再挑一項申報代碼；
          換匯頁／再次確認頁會直接沿用這筆委託的設定，不用重填。位置刻意放在備註
          上方，不要太靠畫面上面。 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 12 }}>結匯性質</div>
        <div style={{ display: "flex", gap: 26 }}>
          {(["common", "other"] as const).map(cat => (
            <div key={cat} onClick={() => { setPurposeCategory(cat); setPurpose(""); }} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{
                width: 20, height: 20, borderRadius: 10, flexShrink: 0,
                border: `2px solid ${purposeCategory === cat ? C.goldDeep : C.lightDim}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {purposeCategory === cat && <span style={{ width: 10, height: 10, borderRadius: 5, background: C.goldDeep }} />}
              </span>
              <span style={{ fontSize: 15, color: C.lightInk, fontWeight: 600 }}>{cat === "common" ? "常用申報性質" : "其他申報性質"}</span>
            </div>
          ))}
        </div>

        {purposeCategory === "other" && (
          <div style={{ fontSize: 13, color: C.lightDim, marginTop: 14, marginBottom: 6 }}>申報細項</div>
        )}
        <div onClick={() => setPurposePickerOpen(true)} style={{
          marginTop: purposeCategory === "common" ? 14 : 0, cursor: "pointer",
          border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <span style={{ fontSize: 14, color: purpose ? C.lightInk : C.lightDim, fontWeight: purpose ? 600 : 400, lineHeight: 1.5 }}>
            {purpose || (purposeCategory === "common" ? "請選擇" : "請選擇申報性質")}
          </span>
          <Icon d={P.chevDown} size={13} color={C.lightDim} />
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
            {mode === 1 ? "到價自動換" : mode === 2 ? "區間找低點" : "智能提醒"}
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
