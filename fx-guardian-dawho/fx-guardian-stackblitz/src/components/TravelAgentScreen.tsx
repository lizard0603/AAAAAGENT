import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt } from "../data/format";
import { detectTravelSignal } from "../agent/travelSignal";
import cardArt from "../assets/sinopac-card.png";
import type { CurrencyCode, FxDatabase, TravelFxHandoff } from "../types/fx";

interface Destination {
  id: string;
  label: string;
  ccy: CurrencyCode; // "" = 「其他」，沒有指定幣別，換匯建議直接跳過
  ccyLabel: string; // 幣別的中文說法（日圓／韓元／美元／歐元），給建議文案用
  flag: string;
  fallbackRate?: number; // TWD per 1 單位外幣，只有 db.fxRates 沒有這個幣別時才用
}

// 這個 app 的 db.fxRates 目前只有 USD/JPY/CNY（換匯守衛支援的幣別）。
// 韓國(KRW)、歐洲(EUR)沒有真實牌告匯率可用，這裡放一個粗估的示範匯率，
// 只給這頁概算「建議換多少錢」用，不當作真的匯率報價；「其他」連粗估都沒有，
// 建議換匯卡片會直接說明無法概算。
const DESTINATIONS: Destination[] = [
  { id: "JP", label: "日本", ccy: "JPY", ccyLabel: "日圓", flag: "🇯🇵" },
  { id: "KR", label: "韓國", ccy: "KRW", ccyLabel: "韓元", flag: "🇰🇷", fallbackRate: 0.024 },
  { id: "US", label: "美國", ccy: "USD", ccyLabel: "美元", flag: "🇺🇸" },
  { id: "EU", label: "歐洲", ccy: "EUR", ccyLabel: "歐元", flag: "🇪🇺", fallbackRate: 35 },
  { id: "OTHER", label: "其他", ccy: "", ccyLabel: "外幣", flag: "🌍" },
];

// 每日預算的目的地預設值——依 Numbeo 2026 各城市相對台北的生活成本倍數，
// 乘上台灣旅遊每日基準 NT$1800 概算，只是背景參考，不是精算報價。
const DEFAULT_BUDGET: Record<string, number> = { JP: 2000, KR: 2200, US: 5000, EU: 3600, OTHER: 2500 };

const ROUND_TO: Record<string, number> = { JPY: 1000, KRW: 10000, USD: 50, EUR: 50 };

const CARD_PITCH: Record<string, string> = {
  JP: "日本當地消費、日圓提領都享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換日圓還有專屬結匯優惠。",
  KR: "韓國當地消費享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換韓元還有專屬結匯優惠。",
  US: "美國消費回饋最高，用「永豐幣倍卡」在 DAWHO app 換美元還有專屬結匯優惠。",
  EU: "歐元區消費享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換歐元還有專屬結匯優惠。",
  OTHER: "不管去哪裡，海外消費都享加碼回饋，用「永豐幣倍卡」在 DAWHO app 依實際幣別辦理結匯還有專屬優惠。",
};

const CARD_MODES = [
  { id: "spend", label: "海外刷卡", icon: P.card, stat: "3.5%", statLabel: "現金回饋" },
  { id: "atm", label: "海外提款", icon: P.swap, stat: "0元", statLabel: "提領手續費" },
] as const;

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
  foreignAmount: number | null; // null = 「其他」，沒有幣別可概算
}

export function TravelAgentScreen({ db, go, onHandoff }: { db: FxDatabase; go: (s: string) => void; onHandoff: (handoff: TravelFxHandoff) => void }) {
  const signal = detectTravelSignal(db.cardTransactions);

  const [destId, setDestId] = useState(DESTINATIONS[0].id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dailyBudget, setDailyBudget] = useState(String(DEFAULT_BUDGET[DESTINATIONS[0].id]));
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [cardMode, setCardMode] = useState<(typeof CARD_MODES)[number]["id"]>("spend");
  const [cardApplySent, setCardApplySent] = useState(false);
  const [reportEnabled, setReportEnabled] = useState(false);

  const dest = DESTINATIONS.find(d => d.id === destId) ?? DESTINATIONS[0];
  // 換匯守衛（SetupScreen）目前只能選 db.fxRates 裡有牌告匯率的幣別，
  // 韓元／歐元只是這頁概算用的示範匯率，換匯守衛還選不到，沒辦法真的把委託帶過去；
  // 「其他」連幣別都沒有，同樣擋掉。
  const destSupported = !!dest.ccy && !!db.fxRates[dest.ccy];
  const activeCardMode = CARD_MODES.find(m => m.id === cardMode) ?? CARD_MODES[0];

  function selectDestination(id: string) {
    setDestId(id);
    setDailyBudget(String(DEFAULT_BUDGET[id] ?? 2500));
    setSuggestion(null);
  }

  function generate() {
    if (!startDate || !endDate) return setError("請填寫出發日與回國日。");
    if (startDate > endDate) return setError("回國日不能早於出發日。");
    const budget = Number(dailyBudget);
    if (!budget || budget <= 0) return setError("每日預算請輸入大於 0 的數字。");
    const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
    const totalTwd = days * budget;
    const foreignAmount = dest.ccy ? roundSuggested(totalTwd / getRate(db, dest), dest.ccy) : null;
    setError("");
    setCardApplySent(false);
    setReportEnabled(false);
    setSuggestion({ dest, days, dailyBudget: budget, totalTwd, foreignAmount });
  }

  function sendToGuardian() {
    if (!suggestion || suggestion.foreignAmount == null || !db.fxRates[suggestion.dest.ccy]) return;
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
            <button key={d.id} onClick={() => selectDestination(d.id)} style={{
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
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10 }}>已依目的地帶入常見參考值，可自行調整</div>
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
            {suggestion.foreignAmount != null ? (
              <>
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
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.6 }}>
                「其他」沒有指定幣別，換匯守衛無法概算建議金額。請改選實際的目的地，或自行到換匯守衛依實際幣別設定委託。
              </div>
            )}
          </div>

          {/* ② 推薦信用卡 */}
          <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.goldLt, marginBottom: 8 }}>② 推薦信用卡</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <img src={cardArt} alt="" style={{ width: 40, height: 25.4, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>永豐幣倍卡</span>
                  <span style={{ fontSize: 11, color: C.textDim, border: `1px solid ${C.line}`, borderRadius: 6, padding: "2px 6px" }}>雙幣卡</span>
                </div>
                <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>{CARD_PITCH[suggestion.dest.id]}</div>
                {!db.user.ownsBiCcyCard && (
                  <button onClick={() => setCardApplySent(true)} disabled={cardApplySent} style={{
                    marginTop: 12, width: "100%", border: "none", borderRadius: 10, padding: "10px 0",
                    fontSize: 13, fontWeight: 800, cursor: cardApplySent ? "default" : "pointer",
                    background: cardApplySent ? "transparent" : `linear-gradient(100deg,${C.goldDeep},${C.gold})`,
                    color: cardApplySent ? "#8fd9ac" : C.ink,
                  }}>{cardApplySent ? "✓ 已收到申辦意願，將由專人與您聯繫" : "立即申辦永豐幣倍卡"}</button>
                )}
              </div>

              {/* 回饋試算儀表板 — 切換「海外刷卡／海外提款」模式看對應回饋 */}
              <div style={{ width: 104, flexShrink: 0, background: C.bgDeep, borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {CARD_MODES.map(m => (
                  <button key={m.id} onClick={() => setCardMode(m.id)} style={{
                    display: "flex", alignItems: "center", gap: 6, border: "none", borderRadius: 7, padding: "6px 8px", cursor: "pointer",
                    background: cardMode === m.id ? "rgba(201,161,90,.22)" : "transparent",
                  }}>
                    <Icon d={m.icon} size={13} color={cardMode === m.id ? C.goldLt : C.textDim} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: cardMode === m.id ? C.goldLt : C.textDim }}>{m.label}</span>
                  </button>
                ))}
                <div style={{ textAlign: "center", marginTop: 2, borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: C.goldLt }}>{activeCardMode.stat}</div>
                  <div style={{ fontSize: 9.5, color: C.textDim, marginTop: 1 }}>{activeCardMode.statLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ③ 旅遊收支報告 */}
          <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.goldLt, marginBottom: 8 }}>③ 旅遊收支報告</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, color: C.text }}>
              <span style={{ color: C.textDim }}>天數</span><span>{suggestion.days} 天</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, color: C.text }}>
              <span style={{ color: C.textDim }}>每日預算</span><span>NT$ {fmt(suggestion.dailyBudget)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 15, color: C.goldLt, fontWeight: 800, borderTop: `1px solid ${C.line}`, marginTop: 4, paddingTop: 10 }}>
              <span>總預算估算</span><span>NT$ {fmt(suggestion.totalTwd)}</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              {reportEnabled ? (
                <div style={{ fontSize: 12.5, color: "#8fd9ac", lineHeight: 1.6 }}>
                  ✓ 已為您啟用旅遊收支追蹤。您將在旅遊期間即時收到消費彙整，並於旅程結束後收到完整收支報告，協助您掌握每一筆海外支出、優化財務管理體驗。
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.6, marginBottom: 10 }}>
                    啟用後，DAWHO 會在旅程期間即時為您彙整海外消費，並於返國後自動整理成完整收支報告，協助您掌握每一筆支出、優化財務管理體驗。
                  </div>
                  <button onClick={() => setReportEnabled(true)} style={{
                    width: "100%", border: `1px solid ${C.goldDeep}`, background: "transparent", color: C.goldLt,
                    borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                  }}>啟用收支報告</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 30 }} />
    </div>
  );
}
