import type { FxDatabase, ChatMessage } from "../types/fx";
import { fmt } from "../data/format";

// ============================================================
//  In-browser mock responder (no backend, no API key)
//  ------------------------------------------------------------
//  Lets the POC run fully in the browser (e.g. StackBlitz).
//  Same mode-aware scripting as the server mock, but reads the
//  typed FxDatabase directly instead of parsing a prompt.
//  When VITE_USE_BACKEND=true the client calls the real backend
//  proxy (Claude API) instead — see fxGuardian.ts.
// ============================================================

export function mockReplyFromDb(
  db: FxDatabase,
  userMessage: string,
  _history: ChatMessage[] = []
): string {
  const order = db.fxWatch[0];
  const usd = db.fxRates[order.target_ccy] ?? db.fxRates.USD;

  const bankSell = usd.bank_sell;
  const target = order.targetRate;
  const amount = order.amount_twd;
  const converted = Math.floor(amount / bankSell);
  const touched = target != null && bankSell <= target;
  const expired = order.window_end ? db.today >= order.window_end : false;
  const isOpener = userMessage.includes("（系統：");

  // ---- mode 3: touched but window open → advise, client decides ----
  if (order.mode === 3 && touched && !expired) {
    if (isOpener) {
      return `${db.user.name}午安，美元買入價已來到 ${bankSell}，已達您設定的門檻 ${target}。以 NT$ ${fmt(
        amount
      )} 試算約可換得 US$ ${fmt(converted)}。不過目前仍在您的換匯區間內（至 ${order.window_end}），是否要現在鎖定、或再觀望一下，由您決定——需要我幫您鎖定嗎？`;
    }
    if (userMessage.includes("等") || userMessage.includes("為什麼")) {
      return `我的角色是提醒與試算，最終由您拍板。目前 ${bankSell} 已優於門檻，20 日均價約 ${usd.ma20}，短線仍有機會再低，但也可能回升。若您重視「確定換到」可現在鎖定；想再等更低點，我會持續盯著，到期 ${order.window_end} 前一定為您完成。`;
    }
    if (userMessage.includes("試算") || userMessage.includes("100")) {
      return `以目前買入價 ${bankSell} 計算，NT$ ${fmt(amount)} 約可換得 US$ ${fmt(
        converted
      )}。這已達您的門檻 ${target}，是否要我為您鎖定此報價？`;
    }
    return `目前美元 ${bankSell}，已達門檻 ${target}，NT$ ${fmt(amount)} 約可換 US$ ${fmt(
      converted
    )}。是否現在鎖定，或再觀望？由您決定。`;
  }

  // ---- execute state ----
  if (touched && (order.mode === 1 || expired)) {
    return `美元買入價 ${bankSell} 已達執行條件，NT$ ${fmt(amount)} 約可換得 US$ ${fmt(
      converted
    )}。依您的委託，換匯守衛可授權即執行，請確認是否送出。`;
  }

  // ---- monitoring ----
  const gap = target != null ? (bankSell - target).toFixed(2) : "—";
  return `目前美元買入價 ${bankSell}，距離您的目標 ${target} 還差約 ${gap} 元。我會持續監控，一旦觸及門檻立即通知您。`;
}
