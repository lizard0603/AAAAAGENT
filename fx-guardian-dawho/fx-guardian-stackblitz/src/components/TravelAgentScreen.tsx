import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt } from "../data/format";
import { detectTravelSignal } from "../agent/travelSignal";
import { SINOPAC_CURRENCIES } from "../data/currencies";
import { DEFAULT_SETTLEMENT_PURPOSE } from "../data/settlementPurpose";
import cardArt from "../assets/sinopac-card.png";
import type { CurrencyCode, FxDatabase, TravelFxHandoff } from "../types/fx";

// 永豐信用卡申辦頁（幣倍卡卡面），從 DAWHO app 導過去掛 utm 追蹤這顆按鈕的成效。
const CARD_APPLY_URL = "https://mma.sinopac.com/SinoCard/Application/ApplyCard?IsHouseLoanCard=false&CardFace=211840&utm_source=dawhoapp&utm_medium=button&utm_term=nonpaid&utm_content=d&utm_campaign=dawhocard202107";

interface Destination {
  id: string;
  label: string;
  ccy: CurrencyCode;
  ccyLabel: string; // 幣別的中文說法，給建議文案用
  flag: string;
}

// 目的地選單直接從永豐承作的幣別清單（data/currencies.ts）長出來——每個有對應
// 國家的幣別都是一顆可以直接點的按鈕，都能實際概算建議換匯金額並帶去換匯守衛。
// 離岸人民幣（CNH）沒有對應的獨立旅遊目的地，不會出現在這裡。
const DESTINATIONS: Destination[] = SINOPAC_CURRENCIES
  .filter(c => c.country)
  .map(c => ({ id: c.ccy, label: c.country!, ccy: c.ccy, ccyLabel: c.ccyLabel, flag: c.flag }));

// 下拉選單裡的「其他國家」——永豐沒有承作當地幣別的常見旅遊目的地。這些目的地
// 一律「預設換美金」概算建議金額（ccy 直接設成 USD），使用者到當地再另外處理
// 現金；不是完全沒有建議可看，只是幣別統一用美金概算。
const OTHER_COUNTRIES: Destination[] = [
  { id: "KR", label: "韓國", ccy: "USD", ccyLabel: "美金", flag: "🇰🇷" },
  { id: "MO", label: "澳門", ccy: "USD", ccyLabel: "美金", flag: "🇲🇴" },
  { id: "TH", label: "泰國", ccy: "USD", ccyLabel: "美金", flag: "🇹🇭" },
  { id: "VN", label: "越南", ccy: "USD", ccyLabel: "美金", flag: "🇻🇳" },
  { id: "MY", label: "馬來西亞", ccy: "USD", ccyLabel: "美金", flag: "🇲🇾" },
  { id: "PH", label: "菲律賓", ccy: "USD", ccyLabel: "美金", flag: "🇵🇭" },
  { id: "ID", label: "印尼", ccy: "USD", ccyLabel: "美金", flag: "🇮🇩" },
  { id: "IN", label: "印度", ccy: "USD", ccyLabel: "美金", flag: "🇮🇳" },
  { id: "AE", label: "阿聯酋", ccy: "USD", ccyLabel: "美金", flag: "🇦🇪" },
  { id: "TR", label: "土耳其", ccy: "USD", ccyLabel: "美金", flag: "🇹🇷" },
  { id: "OTHER", label: "其他國家", ccy: "USD", ccyLabel: "美金", flag: "🌍" },
];

const ALL_DESTINATIONS = [...DESTINATIONS, ...OTHER_COUNTRIES];

// 每日預算的目的地預設值——依 Numbeo 2026 各城市相對台北的生活成本倍數，
// 乘上台灣旅遊每日基準 NT$1800 概算，只是背景參考，不是精算報價。沒列出的
// 目的地一律用 2500 這個通用預設值。目的地 id 是幣別代碼（見 DESTINATIONS），
// 「其他國家」清單裡的目的地維持自己的國家代碼（如 KR、TH）。
const DEFAULT_BUDGET: Record<string, number> = { JPY: 2000, KR: 2200, USD: 5000, EUR: 3600 };

const ROUND_TO: Record<string, number> = { JPY: 1000, CNY: 100, CNH: 100 };

// 每段文案後面都補一句簡短的權益提示（機場貴賓室、旅遊不便險等），取代原本
// 另外做一排圖示的「旅遊權益」區塊——用文字帶過就好，版面才不會太重。
const CARD_PITCH: Record<string, string> = {
  JPY: "日本當地消費、日圓提領都享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換日圓還有專屬結匯優惠，另享機場貴賓室、旅遊不便險等多項旅遊禮遇。",
  USD: "美國消費回饋最高，用「永豐幣倍卡」在 DAWHO app 換美元還有專屬結匯優惠，另享機場貴賓室、旅遊不便險等多項旅遊禮遇。",
  EUR: "歐元區消費享加碼回饋，用「永豐幣倍卡」在 DAWHO app 換歐元還有專屬結匯優惠，另享機場貴賓室、旅遊不便險等多項旅遊禮遇。",
};
const DEFAULT_CARD_PITCH = "不管去哪裡，海外消費都享加碼回饋，用「永豐幣倍卡」在 DAWHO app 依實際幣別辦理結匯還有專屬優惠，另享機場貴賓室、旅遊不便險等多項旅遊禮遇。";

const CARD_MODES = [
  { id: "spend", label: "海外刷卡", icon: P.card, stat: "3.5%", statLabel: "現金回饋" },
  { id: "atm", label: "海外提款", icon: P.swap, stat: "0元", statLabel: "提領手續費" },
] as const;

function getRate(db: FxDatabase, dest: Destination): number {
  return db.fxRates[dest.ccy]?.bank_sell ?? 1;
}

function roundSuggested(amount: number, ccy: string): number {
  const step = ROUND_TO[ccy] ?? 50;
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

  // 預設目的地固定用日本——這是這個 demo 情境（signal 偵測、CARD_PITCH 文案）
  // 一直以來預設展示的目的地，不要因為幣別清單的排序而跟著變動。
  const DEFAULT_DEST_ID = DESTINATIONS.find(d => d.ccy === "JPY")?.id ?? DESTINATIONS[0].id;
  const [destId, setDestId] = useState(DEFAULT_DEST_ID);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dailyBudget, setDailyBudget] = useState(String(DEFAULT_BUDGET[DEFAULT_DEST_ID] ?? 2500));
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [cardMode, setCardMode] = useState<(typeof CARD_MODES)[number]["id"]>("spend");
  const [cardApplySent, setCardApplySent] = useState(false);
  const [reportEnabled, setReportEnabled] = useState(false);

  const dest = ALL_DESTINATIONS.find(d => d.id === destId) ?? DESTINATIONS[0];
  // 目的地的幣別現在一定對得到 db.fxRates（永豐支援的目的地用實際幣別，
  // 「其他國家」一律預設美金），這裡留著是保險，避免萬一資料兜不起來時整頁掛掉。
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
      note: `旅遊小助手建議：${suggestion.dest.label}行程 ${startDate}～${endDate}，建議於出發前完成換匯。`,
      settlementPurpose: DEFAULT_SETTLEMENT_PURPOSE,
    });
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
        <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={P.plane} size={20} color={C.goldLt} fill={C.goldLt} sw={0} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>旅遊小助手</div>
      </div>

      <div style={{ padding: "16px 18px 0" }}>
        {/* 代理人開場說明 */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon d={P.plane} size={15} color={C.goldLt} fill={C.goldLt} sw={0} />
          </div>
          <div style={{ maxWidth: "88%", padding: "12px 14px", borderRadius: 16, borderBottomLeftRadius: 4, background: C.card, color: C.text, fontSize: 14, lineHeight: 1.6 }}>
            {signal ? (
              <>
                {db.user.name}您好，我從您的信用卡消費中偵測到一筆「{signal.transaction.merchant}」的{signal.categoryLabel}消費
                （{signal.transaction.date.slice(5).replace("-", "/")}，NT$ {fmt(signal.transaction.amountTwd)}），
                看起來您即將出國，我主動來幫您準備這趟旅程的換匯與消費安排。
              </>
            ) : (
              <>{db.user.name}您好，我是旅遊小助手。告訴我您的行程資訊，我可以幫您估算建議換匯金額，並推薦適合的出國消費卡片。</>
            )}
          </div>
        </div>
      </div>

      {/* 設定區——目的地改成單一下拉選單，涵蓋永豐支援的幣別＋其他常見旅遊國家，
          不再用一排按鈕塞 13 個目的地。 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>目的地</div>
        <div style={{ position: "relative" }}>
          <select
            value={destId}
            onChange={e => e.target.value && selectDestination(e.target.value)}
            style={{
              width: "100%", appearance: "none", cursor: "pointer",
              border: `1px solid ${C.goldDeep}`, borderRadius: 10, padding: "12px 34px 12px 14px",
              background: "rgba(201,161,90,.18)", color: C.goldLt, fontSize: 15, fontWeight: 700, colorScheme: "dark",
            }}
          >
            <optgroup label="永豐支援當地幣別">
              {DESTINATIONS.map(d => (
                <option key={d.id} value={d.id}>{d.flag} {d.label}</option>
              ))}
            </optgroup>
            <optgroup label="其他國家（預設概算美金）">
              {OTHER_COUNTRIES.map(c => (
                <option key={c.id} value={c.id}>{c.flag} {c.label}</option>
              ))}
            </optgroup>
          </select>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon d={P.chevDown} size={13} color={C.goldLt} />
          </div>
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
          <div style={{ fontSize: 15, fontWeight: 800, color: C.goldLt }}>旅遊小助手為您準備了以下建議</div>

          {/* ① 建議換匯——沒有指定幣別的目的地無法概算，整張卡直接不顯示 */}
          {suggestion.foreignAmount != null && (
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
          )}

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
                <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>{CARD_PITCH[suggestion.dest.id] ?? DEFAULT_CARD_PITCH}</div>
              </div>

              {/* 回饋試算儀表板 — 切換「海外刷卡／海外提款」模式看對應回饋 */}
              <div style={{ width: 88, flexShrink: 0, background: C.bgDeep, borderRadius: 10, padding: 7, display: "flex", flexDirection: "column", gap: 6 }}>
                {CARD_MODES.map(m => (
                  <button key={m.id} onClick={() => setCardMode(m.id)} style={{
                    display: "flex", alignItems: "center", gap: 5, border: "none", borderRadius: 7, padding: "6px 6px", cursor: "pointer",
                    background: cardMode === m.id ? "rgba(201,161,90,.22)" : "transparent",
                  }}>
                    <Icon d={m.icon} size={12} color={cardMode === m.id ? C.goldLt : C.textDim} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: cardMode === m.id ? C.goldLt : C.textDim }}>{m.label}</span>
                  </button>
                ))}
                <div style={{ textAlign: "center", marginTop: 2, borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.goldLt }}>{activeCardMode.stat}</div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>{activeCardMode.statLabel}</div>
                </div>
              </div>
            </div>

            {!db.user.ownsBiCcyCard && (
              <button onClick={() => { window.open(CARD_APPLY_URL, "_blank", "noopener,noreferrer"); setCardApplySent(true); }} style={{
                marginTop: 14, width: "100%", border: "none", borderRadius: 10, padding: "10px 0",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                background: cardApplySent ? "transparent" : `linear-gradient(100deg,${C.goldDeep},${C.gold})`,
                color: cardApplySent ? "#8fd9ac" : C.ink,
              }}>{cardApplySent ? "✓ 已為您開啟申辦頁面，可再次點擊重新開啟" : "立即申辦永豐幣倍卡"}</button>
            )}
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
