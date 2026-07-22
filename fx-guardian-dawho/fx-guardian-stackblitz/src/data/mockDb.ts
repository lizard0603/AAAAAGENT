import type { FxDatabase } from "../types/fx";

// ============================================================
//  MOCK DATABASE — replace with real data when ready.
//  Demo tuned so mode 3 lands in "advise" (示警建議) state.
// ============================================================
export const mockDb: FxDatabase = {
  today: "2026-07-15",
  user: { name: "洪先生", tier: "DAWHO 大戶", memberId: "SP-88031" },
  accounts: [
    { ccy: "TWD", label: "臺幣存款", balance: 142957 },
    { ccy: "USD", label: "外幣存款", balance: 546 },
    { ccy: "JPY", label: "日圓活存", balance: 1250000 },
  ],
  fxRates: {
    USD: { spot: 32.235, bank_buy: 32.11, bank_sell: 32.211, day_low: 32.18, day_high: 32.34, ma20: 32.02 },
    JPY: { spot: 0.2001, bank_buy: 0.1985, bank_sell: 0.2015, day_low: 0.1998, day_high: 0.2045, ma20: 0.2038 },
    CNY: { spot: 4.7712, bank_buy: 4.75, bank_sell: 4.79, day_low: 4.76, day_high: 4.82, ma20: 4.74 },
  },
  // No order configured yet — the customer sets one up via the setup flow.
  fxWatch: [],
  history: [],
};
