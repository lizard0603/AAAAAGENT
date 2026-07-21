import type { FxDatabase, Opportunity, ChatMessage } from "../types/fx";
import { fmt } from "../data/format";

// ============================================================
//  In-browser mock responder (no backend, no API key)
//  ------------------------------------------------------------
//  Lets the POC run fully in the browser (e.g. StackBlitz).
//  Same mode-aware scripting as the server mock, but reads the
//  typed FxDatabase directly instead of parsing a prompt.
//  When VITE_USE_BACKEND=true the client calls the real backend
//  proxy (Claude API) instead — see fxGuardian.ts.
//
//  State (advise / execute / none) always comes from the caller's
//  Opportunity (opportunity.ts), never re-derived here — mode 2
//  orders have no targetRate, so re-deriving "touched" locally
//  used to silently break the execute/monitoring branches for them.
// ============================================================

const CCY_LABEL: Record<string, string> = { USD: "美元", JPY: "日圓", CNY: "人民幣" };
const CCY_SYMBOL: Record<string, string> = { USD: "US$", JPY: "¥", CNY: "¥" };

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
  const isOpener = userMessage.includes("（系統：");

  // ---- advise: touched/relative-low but window open → client decides ----
  if (opp.state === "advise") {
    const reasonText = target != null ? `已達您設定的門檻 ${target}` : `已低於 20 日均價 ${rate.ma20}，是相對低點`;
    if (isOpener) {
      return `${db.user.name}午安，${ccy}買入價已來到 ${bankSell}，${reasonText}。以 NT$ ${fmt(amount)} 試算約可換得 ${sym} ${fmt(
        converted
      )}。不過目前仍在您的換匯區間內（至 ${order.window_end}），是否要現在鎖定、或再觀望一下，由您決定——需要我幫您鎖定嗎？`;
    }
    if (userMessage.includes("等") || userMessage.includes("為什麼")) {
      return `我的角色是提醒與試算，最終由您拍板。${reasonText}，短線仍有機會再低，但也可能回升。若您重視「確定換到」可現在鎖定；想再等更低點，我會持續盯著，到期 ${order.window_end} 前一定為您完成。`;
    }
    if (userMessage.includes("試算") || userMessage.includes("100")) {
      return `以目前買入價 ${bankSell} 計算，NT$ ${fmt(amount)} 約可換得 ${sym} ${fmt(converted)}。${reasonText}，是否要我為您鎖定此報價？`;
    }
    return `目前${ccy} ${bankSell}，${reasonText}，NT$ ${fmt(amount)} 約可換 ${sym} ${fmt(converted)}。是否現在鎖定，或再觀望？由您決定。`;
  }

  // ---- execute: authorized to go ahead (touched, or window guarantee kicked in) ----
  if (opp.state === "execute") {
    const reason = opp.touched ? "已達執行條件" : "區間已到期，將以當日匯率保證完成";
    return `${ccy}買入價 ${bankSell} ${reason}，NT$ ${fmt(amount)} 約可換得 ${sym} ${fmt(
      converted
    )}。依您的委託，換匯守衛可授權即執行，請確認是否送出。`;
  }

  // ---- monitoring ----
  if (target != null) {
    const gap = (bankSell - target).toFixed(2);
    return `目前${ccy}買入價 ${bankSell}，距離您的目標 ${target} 還差約 ${gap} 元。我會持續監控，一旦觸及門檻立即通知您。`;
  }
  return `目前${ccy}買入價 ${bankSell}，20 日均價 ${rate.ma20}，暫時還沒看到相對低點。我會持續監控，一旦出現機會立即通知您。`;
}
