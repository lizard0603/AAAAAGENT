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
  const rate = db.fxRates[order.target_ccy];
  const bankSell = rate.bank_sell;

  const touched = order.targetRate != null ? bankSell <= order.targetRate : false;
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
