import type { FxDatabase, Opportunity } from "../types/fx";

// ============================================================
//  Opportunity evaluation
//  ------------------------------------------------------------
//  Pure function that turns the DB + first order into a UI state.
//  This is the heart of the three-mode logic — edit here when
//  your real "relative low" / execution rules land.
// ============================================================

export function detectOpportunity(db: FxDatabase): Opportunity {
  const order = db.fxWatch[0];
  if (!order) {
    return { rate: 0, target: undefined, touched: false, expired: false, hit: false, state: "none" };
  }
  const rate = db.fxRates[order.target_ccy];
  const bankSell = rate.bank_sell;

  // 買外幣（TWD→target_ccy）時，買入價「越低」對客戶越有利，所以門檻預設方向是
  // "below"（達到或優於，即 bankSell <= targetRate）。"above" 保留給未來的情境，
  // 目前 SetupScreen 不會讓使用者存出 above + 買外幣 的組合。
  const direction = order.targetDirection ?? "below";
  const touched =
    order.targetRate != null
      ? direction === "below"
        ? bankSell <= order.targetRate
        : bankSell >= order.targetRate
      : false;
  const expired = order.window_end ? db.today >= order.window_end : false;

  const base = {
    rate: bankSell,
    target: order.targetRate,
    touched,
    expired,
    order,
  };

  // ---- Mode 1: threshold only ----
  if (order.mode === 1) {
    return { ...base, hit: touched, state: touched ? "execute" : "none" };
  }

  // ---- Mode 2: window only (AI picks a relative low; guarantee on expiry) ----
  if (order.mode === 2) {
    if (expired) return { ...base, hit: true, state: "execute" };
    // NOTE: placeholder "relative low" rule = below 20-day MA.
    // Swap for your real indicator (volatility band, channel, etc.).
    const relLow = bankSell < rate.ma20;
    return { ...base, hit: relLow, state: relLow ? "advise" : "none" };
  }

  // ---- Mode 3: threshold + window ----
  // touched & expired         → execute (deadline reached)
  // touched & !expired        → advise  (AI may see lower; CLIENT decides)
  // !touched & expired        → execute (guarantee completion at today's rate)
  // !touched & !expired       → none    (keep monitoring)
  if (touched && expired) return { ...base, hit: true, state: "execute" };
  if (touched && !expired) return { ...base, hit: true, state: "advise" };
  if (!touched && expired) return { ...base, hit: true, state: "execute" };
  return { ...base, hit: false, state: "none" };
}
