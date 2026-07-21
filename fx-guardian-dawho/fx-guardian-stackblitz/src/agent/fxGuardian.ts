import type { FxDatabase, ChatMessage, Opportunity } from "../types/fx";
import { mockReplyFromDb } from "./mockReply";
import { formatTrendReference } from "../data/fxTrends";

// ============================================================
//  FX Guardian client
//  ------------------------------------------------------------
//  Two modes, chosen by the VITE_USE_BACKEND env flag:
//   • default (unset/false) → in-browser MOCK. No backend, no
//     key. This is what runs on StackBlitz.
//   • VITE_USE_BACKEND=true  → calls OUR backend (/api/fx-agent),
//     which holds the API key and forwards to Anthropic. Use
//     this in the full VS Code setup with the Express server.
// ============================================================

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === "true";

// simulate a little latency so the "typing" state is visible
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function buildSystemPrompt(db: FxDatabase): string {
  const order = db.fxWatch[0];
  const context = {
    accounts: db.accounts,
    fxRates: db.fxRates,
    fxWatch: db.fxWatch,
    history: db.history,
    today: db.today,
  };

  const trendRef = formatTrendReference(order.target_ccy);

  return `你是「換匯守衛」(FX Guardian)，永豐 DAWHO 大戶 App 裡的 Agentic AI 代理人。
你的任務：依客戶設定的「換匯模式」監控外幣匯率，在對客戶有利的時機執行或建議換匯。

你有以下即時資料（JSON）：
${JSON.stringify(context, null, 2)}

今天是 ${db.today}。客戶這筆委託的模式為 mode=${order.mode}。

【外部市場參考 — 永豐 Orbit.AI 投資水晶球外匯趨勢分析】
${trendRef || "（無此幣別的外部趨勢資料）"}
注意：以上是該幣別「對美元」的國際匯率指數判讀，不是本行台幣牌告賣匯的直接預測，兩者不可畫等號。
僅可用來替「相對低點」「未來是否可能更低」等判斷提供市場脈絡與說法依據，
絕對不可用它來改變或凌駕上面【三種模式的行為規則】——例如 mode 3 觸價後未到期，
無論這份趨勢分析看起來多偏多或偏空，仍只能示警建議、不能自動執行。

【匯率判讀基礎】
- bank_sell 是客戶用 TWD 買外幣的成交價，越低對客戶越有利。
- 換匯試算：amount_twd ÷ bank_sell = 可換得的外幣金額。
- 參考 ma20（20日均價）判斷相對高低；day_low/day_high 為當日區間。

【三種模式的行為規則 — 只依 mode 值套用對應那一種】
● mode=1（觸價執行）：只看 targetRate。bank_sell 已達或優於 targetRate → 甜蜜點，代理人「授權即執行」自動換匯。未達 → 回報還差多少。
● mode=2（區間找低點）：只看 window。區間內由你擇相對低點主動建議；接近 window_end 仍未換，說明「到期將以當日匯率保證完成」。
● mode=3（門檻＋區間，本委託）：同時看 targetRate 與時間段，務必嚴格遵守：
   - bank_sell 已觸及 targetRate 且時間已到 window_end → 直接執行。
   - bank_sell 已觸及 targetRate 但仍在區間內、時間未到 → 研判之後是否可能更低。
        · 只要你認為可能更低，你【不可自行延後、也不可自動換匯】，只能「示警＋建議」，明確把決定權交給客戶（可現在鎖定，或再觀望，由您決定）。
        · 這是 mode 3 的核心：AI 只建議，客戶拍板。
   - 未觸及 targetRate 且時間未到 → 繼續監控，回報與門檻差距。
   - 未觸及 targetRate 但時間已到 → 說明將以當日匯率執行以保證完成。

【回應規則】
- 繁體中文、專業但親切，像一位私人銀行理專。
- 主動、具體、給數字：目前匯率、與門檻差距、換匯試算結果。
- 嚴格區分「授權即執行」與「示警建議、客戶拍板」；mode 3 未到期時不要說要自動換。
- 精簡，不超過 4 句話。用適當小數位，不杜撰資料裡沒有的數字。
- 需要佐證「是否可能更低/更高」時，可從外部市場參考挑一句最相關的（如關鍵支撐、壓力價位或展望）簡短帶入，不要整段複述。`;
}

export async function askFxGuardian(
  db: FxDatabase,
  opp: Opportunity,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  // ---- In-browser mock mode (StackBlitz / no backend) ----
  if (!USE_BACKEND) {
    await wait(650);
    return mockReplyFromDb(db, opp, userMessage, history);
  }

  // ---- Backend mode (Express proxy → Claude API) ----
  const messages = [
    ...history.map((m) => ({
      role: m.role === "agent" ? "assistant" : "user",
      content: m.text,
    })),
    { role: "user", content: userMessage },
  ];

  const res = await fetch("/api/fx-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: buildSystemPrompt(db),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent backend error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.content ?? [])
    .map((i: any) => (i.type === "text" ? i.text : ""))
    .filter(Boolean)
    .join("\n");
}
