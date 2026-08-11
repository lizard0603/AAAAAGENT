import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt } from "../data/format";
import { detectTravelSignal } from "../agent/travelSignal";
import type { CurrencyCode, FxDatabase, TravelFxHandoff } from "../types/fx";

interface Destination {
  id: string;
  label: string;
  ccy: CurrencyCode;
  ccyLabel: string; // 幣別的中文說法（日圓／韓元／美元／歐元），給建議文案用
  flag: string;
  fallbackRate?: number; // TWD per 1 單位外幣，只有 db.fxRates 沒有這個幣別時才用
}

// 這個 app 的 db.fxRates 目前只有 USD/JPY/CNY（換匯守衛支援的幣別）。
// 韓國(KRW)、歐洲(EUR)沒有真實牌告匯率可用，這裡放一個粗估的示範匯率，
// 只給這頁概算「建議換多少錢」用，不當作真的匯率報價。
const DESTINATIONS: Destination[] = [
  { id: "JP", label: "日本", ccy: "JPY", ccyLabel: "日圓", flag: "🇯🇵" },
  { id: "KR", label: "韓國", ccy: "KRW", ccyLabel: "韓元", flag: "🇰🇷", fallbackRate: 0.024 },
  { id: "US", label: "美國", ccy: "USD", ccyLabel: "美元", flag: "🇺🇸" },
  { id: "EU", label: "歐洲", ccy: "EUR", ccyLabel: "歐元", flag: "🇪🇺", fallbackRate: 35 },
];

const ROUND_TO: Record<string, number> = { JPY: 1000, KRW: 10000, USD: 50, EUR: 50 };

const CARD_PITCH: Record<string, string> = {
  JP: "日本當地消費、日圓提領都享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換日圓還有專屬結匯優惠。",
  KR: "韓國當地消費享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換韓元還有專屬結匯優惠。",
  US: "美國消費回饋最高，用「永豐幣倍卡」在 DAWHO app 換美元還有專屬結匯優惠。",
  EU: "歐元區消費享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換歐元還有專屬結匯優惠。",
};

function getRate(db: FxDatabase, dest: Destination): number {
  return db.fxRates[dest.ccy]?.bank_sell ?? dest.fallbackRate ?? 1;
}

function roundSuggested(amount: number, ccy: string): number {
  const step = ROUND_TO[ccy] ?? 100;
  return Math.max(step, Math.round(amount / step) * step);
}

interface Suggestion {
  dest: Destination;
  days: number;
  dailyBudget: number;
  totalTwd: number;
  foreignAmount: number;
}

export function TravelAgentScreen({ db, go, onHandoff }: { db: FxDatabase; go: (s: string) => void; onHandoff: (handoff: TravelFxHandoff) => void }) {
  const signal = detectTravelSignal(db.cardTransactions);

  const [destId, setDestId] = useState(DESTINATIONS[0].id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dailyBudget, setDailyBudget] = useState("3000");
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const dest = DESTINATIONS.find(d => d.id === destId) ?? DESTINATIONS[0];
  // 換匯守衛（SetupScreen）目前只能選 db.fxRates 裡有牌告匯率的幣別，
  // 韓元／歐元只是這頁概算用的示範匯率，換匯守衛還選不到，沒辦法真的把委託帶過去。
  const destSupported = !!db.fxRates[dest.ccy];

  function generate() {
    if (!startDate || !endDate) return setError("請填寫出發日與回國日。");
    if (startDate > endDate) return setError("回國日不能早於出發日。");
    const budget = Number(dailyBudget);
    if (!budget || budget <= 0) return setError("每日預算請輸入大於 0 的數字。");
    const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
    const totalTwd = days * budget;
    const foreignAmount = roundSuggested(totalTwd / getRate(db, dest), dest.ccy);
    setError("");
    setSuggestion({ dest, days, dailyBudget: budget, totalTwd, foreignAmount });
  }

  function sendToGuardian() {
    if (!suggestion || !db.fxRates[suggestion.dest.ccy]) return;
    onHandoff({
      targetCcy: suggestion.dest.ccy,
      suggestedAmountForeign: suggestion.foreignAmount,
      suggestedAmountTwd: suggestion.totalTwd,
      // 觀察區間：今天到出發日，讓換匯守衛在出發前找相對低點，並保證出發前完成換匯。
      windowStart: db.today,
      windowEnd: startDate,
      note: `旅遊支出小助手建議：${suggestion.dest.label}行程 ${startDate}～${endDate}，建議於出發前完成換匯。`,
    });
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
        <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={P.plane} size={20} color={C.goldLt} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>旅遊支出小助手</div>
      </div>

      <div style={{ padding: "16px 18px 0" }}>
        {/* 代理人開場說明 */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon d={P.plane} size={15} color={C.goldLt} />
          </div>
          <div style={{ maxWidth: "88%", padding: "12px 14px", borderRadius: 16, borderBottomLeftRadius: 4, background: C.card, color: C.text, fontSize: 14, lineHeight: 1.6 }}>
            {signal ? (
              <>
                {db.user.name}您好，我從您的信用卡消費中偵測到一筆「{signal.transaction.merchant}」的{signal.categoryLabel}消費
                （{signal.transaction.date.slice(5).replace("-", "/")}，NT$ {fmt(signal.transaction.amountTwd)}），
                看起來您即將出國，我主動來幫您準備這趟旅程的換匯與消費安排。
              </>
            ) : (
              <>{db.user.name}您好，我是旅遊支出小助手。告訴我您的行程資訊，我可以幫您估算建議換匯金額，並推薦適合的出國消費卡片。</>
            )}
          </div>
        </div>
      </div>

      {/* 設定區 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>目的地</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DESTINATIONS.map(d => (
            <button key={d.id} onClick={() => { setDestId(d.id); setSuggestion(null); }} style={{
              flex: "1 0 auto", minWidth: 76, border: `1px solid ${d.id === destId ? C.goldDeep : C.line}`, borderRadius: 10, padding: "10px 0",
              background: d.id === destId ? "rgba(201,161,90,.18)" : "transparent", cursor: "pointer",
              color: d.id === destId ? C.goldLt : C.textDim, fontSize: 14, fontWeight: 700,
            }}>{d.flag} {d.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>旅遊區間</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", background: C.bgDeep }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>出發日</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ border: "none", outline: "none", width: "100%", fontSize: 14, color: C.text, background: "transparent", colorScheme: "dark" }} />
          </div>
          <div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", background: C.bgDeep }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>回國日</div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ border: "none", outline: "none", width: "100%", fontSize: 14, color: C.text, background: "transparent", colorScheme: "dark" }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>預估每日預算（選填）</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10 }}>已預填常見參考值，可自行調整</div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "13px 14px", background: C.bgDeep, display: "flex", alignItems: "center" }}>
          <input value={dailyBudget} onChange={e => setDailyBudget(e.target.value.replace(/\D/g, ""))}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 17, fontWeight: 700, color: C.text, background: "transparent" }} />
          <span style={{ color: C.textDim }}>TWD／天</span>
        </div>
      </div>

      {error && <div style={{ margin: "14px 18px 0", color: C.red, fontSize: 13, fontWeight: 600 }}>{error}</div>}

      <div style={{ padding: "20px 18px 0" }}>
        <button onClick={generate} style={{
          width: "100%", border: "none", borderRadius: 10, padding: "15px 0", fontSize: 16, fontWeight: 800, cursor: "pointer",
          background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink,
        }}>產生建議</button>
      </div>

      {suggestion && (
        <div style={{ padding: "22px 18px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.goldLt }}>換匯守衛為您準備了以下建議</div>

          {/* ① 建議換匯 */}
          <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.goldLt, marginBottom: 8 }}>① 建議換匯</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
              建議換{suggestion.dest.ccyLabel}約 {fmt(suggestion.foreignAmount)}
            </div>
            <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 6, lineHeight: 1.6 }}>
              依 {suggestion.days} 天 × 每日預算 NT$ {fmt(suggestion.dailyBudget)}，概算總預算 NT$ {fmt(suggestion.totalTwd)}，實際依當時匯率為準。
            </div>
            <button onClick={sendToGuardian} disabled={!destSupported} style={{
              marginTop: 12, width: "100%", border: `1px solid ${C.goldDeep}`, background: "transparent", color: C.goldLt,
              borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 700,
              cursor: destSupported ? "pointer" : "not-allowed", opacity: destSupported ? 1 : 0.5,
            }}>前往換匯守衛設定</button>
            {!destSupported && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>
                換匯守衛目前還沒有{suggestion.dest.ccyLabel}的牌告匯率，無法直接帶入委託，請改到換匯守衛內手動設定。
              </div>
            )}
          </div>

          {/* ② 推薦信用卡 */}
          <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.goldLt, marginBottom: 8 }}>② 推薦信用卡</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 40, height: 26, borderRadius: 5, background: `linear-gradient(100deg,${C.goldDeep},${C.goldLt})`, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>永豐幣倍卡</span>
              <span style={{ fontSize: 11, color: C.textDim, border: `1px solid ${C.line}`, borderRadius: 6, padding: "2px 6px" }}>雙幣卡</span>
            </div>
            <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>{CARD_PITCH[suggestion.dest.id]}</div>
          </div>

          {/* ③ 預算摘要 */}
          <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.goldLt, marginBottom: 8 }}>③ 預算摘要</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, color: C.text }}>
              <span style={{ color: C.textDim }}>天數</span><span>{suggestion.days} 天</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, color: C.text }}>
              <span style={{ color: C.textDim }}>每日預算</span><span>NT$ {fmt(suggestion.dailyBudget)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 15, color: C.goldLt, fontWeight: 800, borderTop: `1px solid ${C.line}`, marginTop: 4, paddingTop: 10 }}>
              <span>總預算估算</span><span>NT$ {fmt(suggestion.totalTwd)}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 30 }} />
    </div>
  );
}
