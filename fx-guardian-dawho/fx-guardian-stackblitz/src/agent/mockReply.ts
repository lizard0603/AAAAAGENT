import type { FxDatabase, Opportunity, ChatMessage } from "../types/fx";
import { fmt, rateDecimals } from "../data/format";
import { trendOutlookNote, trendShortNote } from "../data/fxTrends";

// ============================================================
//  In-browser mock responder (no backend, no API key)
//  ------------------------------------------------------------
//  Lets the POC run fully in the browser (e.g. StackBlitz).
//  Same mode-aware scripting as the server mock, but reads the
//  typed FxDatabase directly instead of parsing a prompt.
//  When VITE_USE_BACKEND=true the client calls the real backend
//  proxy (Claude API) instead — see fxGuardian.ts. That path can
//  actually reason about arbitrary free text; this mock cannot —
//  it only pattern-matches a handful of intents per opp.state.
//
//  State (advise / execute / none) always comes from the caller's
//  Opportunity (opportunity.ts), never re-derived here — mode 2
//  orders have no targetRate, so re-deriving "touched" locally
//  used to silently break the execute/monitoring branches for them.
//
//  Design note: previously, free-text input was only pattern-matched
//  inside the "advise" branch — in "none"/"execute" states, whatever
//  the user typed was ignored and the same canned status line came
//  back regardless of the actual question (e.g. asking "為什麼建議我
//  等？" while still just monitoring got the generic gap-to-target
//  line, which doesn't answer "why"). detectIntent() now runs across
//  every state, and anything that doesn't match a known intent gets
//  an honest "我不太確定你在問什麼" fallback (still showing the
//  current status, but not pretending to have answered) instead of
//  silently substituting an unrelated canned reply.
// ============================================================

const CCY_LABEL: Record<string, string> = { USD: "美元", JPY: "日圓", CNY: "人民幣" };
const CCY_SYMBOL: Record<string, string> = { USD: "US$", JPY: "¥", CNY: "¥" };

type Intent = "cancel" | "risk" | "why" | "calc" | "now" | "unknown";

function detectIntent(msg: string): Intent {
  if (/取消|不換了|不要了/.test(msg)) return "cancel";
  if (/風險|安全嗎|會虧|保證|穩嗎/.test(msg)) return "risk";
  if (/為什麼|為何|why|等|慢一點|再看看/i.test(msg)) return "why";
  if (/試算|算一下|多少錢|多少|萬|\d/.test(msg)) return "calc";
  if (/現在|適合|買嗎|換嗎|好嗎|可以嗎/.test(msg)) return "now";
  return "unknown";
}

export function mockReplyFromDb(
  db: FxDatabase,
  opp: Opportunity,
  userMessage: string,
  _history: ChatMessage[] = []
): string {
  const order = db.fxWatch[0];
  if (!order) return "目前尚未設定換匯委託，請先到設定頁告訴我您想要的條件。";

  const rate = db.fxRates[order.target_ccy];
  const ccy = CCY_LABEL[order.target_ccy] ?? order.target_ccy;
  const sym = CCY_SYMBOL[order.target_ccy] ?? order.target_ccy;
  const bankSell = rate.bank_sell;
  const target = order.targetRate;
  const amount = order.amount_twd;
  const converted = Math.floor(amount / bankSell);
  const decimals = rateDecimals(order.target_ccy);
  const isOpener = userMessage.includes("（系統：");
  const intent = isOpener ? null : detectIntent(userMessage);

  // Orbit.AI 外匯趨勢參考（永豐 sinopacBT/webevents/orbitai）：這是該幣別「對美元」
  // 的國際匯率指數走勢判讀，不等於本行台幣賣匯，僅作「可能更低/更高」的市場脈絡佐證。
  // 一律標明是哪個貨幣對（避免看起來像在講台幣賣匯本身），且依情境用不同長度／
  // 角度帶入，避免每則訊息都複誦同一句話。
  const shortNote = trendShortNote(order.target_ccy); // 「美元兌日圓：支撐161.8、壓力162.8–163.0」
  const outlookNote = trendOutlookNote(order.target_ccy); // 較完整的情境展望，用在被追問理由時
  // 兩種形式：mid 接在沒有句號結尾的子句後面（用逗號銜接）；
  // sentence 接在已經以「。」結尾的句子後面（不能再加逗號，否則變成「。，」）。
  const shortHintMid = shortNote ? `，市場觀察（${shortNote}）` : "";
  const shortHintSentence = shortNote ? `市場觀察（${shortNote}）。` : "";
  const outlookHint = outlookNote ? `（${outlookNote}僅供參考，非本行牌告匯率預測）` : "";
  const calcLine = `以目前買入價 ${bankSell} 計算，NT$ ${fmt(amount)} 約可換得 ${sym} ${fmt(converted)}。`;
  const fallback = (statusLine: string) =>
    `不好意思，我沒完全掌握您想問的是哪個部分。我目前能回答：現在適不適合換、幫忙試算金額、為什麼建議等待或執行、換匯風險、還有取消委託。您可以換個方式問，或直接點下面的快速提問。\n\n目前狀況：${statusLine}`;

  // ---- advise: touched/relative-low but window open → client decides ----
  if (opp.state === "advise") {
    const reasonText = target != null ? `已達您設定的門檻 ${target}` : `已低於 20 日均價 ${rate.ma20}，是相對低點`;
    const statusLine = `${ccy}買入價 ${bankSell}，${reasonText}，仍在您的區間內（至 ${order.window_end}）。`;
    if (isOpener) {
      return `${db.user.name}午安，${ccy}買入價已來到 ${bankSell}，${reasonText}。${calcLine}不過目前仍在您的換匯區間內（至 ${order.window_end}）${shortHintMid}，是否要現在鎖定、或再觀望一下，由您決定——需要我幫您鎖定嗎？`;
    }
    if (intent === "cancel") {
      return `了解，若您想取消這筆委託，麻煩點上方「取消此委託」；我會停止監控${ccy}匯率，不會執行這筆換匯。`;
    }
    if (intent === "risk") {
      return `這只是我的判讀與建議，不保證之後一定會更低或更高，最終仍由您決定。${reasonText}，若擔心之後回升，建議現在鎖定較保守；想賭賭看更低點，我會持續盯著到期日。`;
    }
    if (intent === "why") {
      return `我的角色是提醒與試算，最終由您拍板。${reasonText}，短線仍有機會再低，但也可能回升。若您重視「確定換到」可現在鎖定；想再等更低點，我會持續盯著，到期 ${order.window_end} 前一定為您完成。${outlookHint}`;
    }
    if (intent === "calc") {
      return `${calcLine}${reasonText}，是否要我為您鎖定此報價？`;
    }
    if (intent === "now") {
      return `目前${ccy} ${bankSell}，${reasonText}，算是不錯的時機；但區間到 ${order.window_end} 才到期，之後仍有機會更低。要不要現在鎖定，由您決定。`;
    }
    return fallback(statusLine);
  }

  // ---- execute: authorized to go ahead (touched, or window guarantee kicked in) ----
  if (opp.state === "execute") {
    const reason = opp.touched ? "已達執行條件" : "區間已到期，將以當日匯率保證完成";
    const statusLine = `${ccy}買入價 ${bankSell}，${reason}。`;
    if (isOpener) {
      return `${ccy}買入價 ${bankSell} ${reason}，${calcLine}依您的委託，換匯守衛可授權即執行，請確認是否送出。`;
    }
    if (intent === "cancel") {
      return `了解，若您想取消這筆委託，麻煩點上方「取消此委託」；不會執行這筆換匯。`;
    }
    if (intent === "risk") {
      return `這筆已達到您原先設定的執行條件，執行後以當下牌告成交，不會因為之後價格更好或更差而追加或退回；若還不放心，可以先點「先不要」保留，我會繼續監控。`;
    }
    if (intent === "why" || intent === "now") {
      return `${reason}，已經沒有需要再等的理由——依您的委託設定，現在就是可以執行的時機。${calcLine}要不要我幫您送出？`;
    }
    if (intent === "calc") {
      return `${calcLine}要送出這筆換匯嗎？`;
    }
    return fallback(statusLine);
  }

  // ---- monitoring (opp.state === "none") ----
  if (isOpener) {
    if (target != null) {
      const gap = Math.abs(bankSell - target).toFixed(decimals);
      return `目前${ccy}買入價 ${bankSell}，距離您的目標 ${target} 還差約 ${gap}。我會持續監控，一旦觸及門檻立即通知您。`;
    }
    return `目前${ccy}買入價 ${bankSell}，20 日均價 ${rate.ma20}，暫時還沒看到相對低點。我會持續監控，一旦出現機會立即通知您。`;
  }

  const statusLine =
    target != null
      ? `${ccy}買入價 ${bankSell}，距離您的目標 ${target} 還差約 ${Math.abs(bankSell - target).toFixed(decimals)}。`
      : `${ccy}買入價 ${bankSell}，20 日均價 ${rate.ma20}，暫時還沒看到相對低點。`;

  if (intent === "cancel") {
    return `了解，若您想取消這筆委託，麻煩點上方「取消此委託」；我會停止監控${ccy}匯率。`;
  }
  if (intent === "risk") {
    return `我只會在符合您設定的條件時才提醒或執行，不會擅自出手。目前${statusLine}${shortHintSentence}`;
  }
  if (intent === "why") {
    return `目前${statusLine}還沒有到建議動作的時機。${outlookHint}我會持續監控，一旦觸及門檻立即通知您。`;
  }
  if (intent === "calc") {
    return `${calcLine}不過目前${statusLine}供您參考。`;
  }
  if (intent === "now") {
    return `目前${statusLine}現在換的話還沒到您設定的甜蜜點，建議再等等，我會持續盯著。`;
  }
  return fallback(statusLine);
}
