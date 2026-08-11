import type { FxDatabase } from "../types/fx";

// ============================================================
//  MOCK DATABASE — replace with real data when ready.
//  Demo tuned so mode 3 lands in "advise" (示警建議) state.
// ============================================================
export const mockDb: FxDatabase = {
  today: "2026-07-15",
  user: { name: "洪先生", tier: "DAWHO 大戶", memberId: "SP-88031" },
  accounts: [
    { ccy: "TWD", label: "臺幣存款", balance: 142957, accountNo: "204-018-0082075-4" },
    { ccy: "USD", label: "外幣存款", balance: 546, accountNo: "204-008-0082075-2" },
    { ccy: "JPY", label: "日圓活存", balance: 1250000, accountNo: "204-008-0082075-3" },
    { ccy: "CNY", label: "人民幣活存", balance: 0, accountNo: "204-008-0082075-6" },
  ],
  fxRates: {
    USD: { spot: 32.235, bank_buy: 32.11, bank_sell: 32.211, day_low: 32.18, day_high: 32.34, ma20: 32.02 },
    JPY: { spot: 0.2001, bank_buy: 0.1985, bank_sell: 0.2015, day_low: 0.1998, day_high: 0.2045, ma20: 0.2038 },
    CNY: { spot: 4.7712, bank_buy: 4.75, bank_sell: 4.79, day_low: 4.76, day_high: 4.82, ma20: 4.74 },
  },
  // No order configured yet — the customer sets one up via the setup flow.
  fxWatch: [],
  history: [],
  // 信用卡消費紀錄（依日期新到舊排列，跟畫面上「最新消費記錄」的順序一致）。
  // 前四筆是「即將出國」情境（機票／訂房／飯店／行程），其餘是日常消費當背景雜訊，
  // 用來測 agent/travelSignal.ts 的 detectTravelSignal() 有沒有正確只挑出旅遊訊號、
  // 忽略無關消費。mcc 只給偵測邏輯用，不顯示在畫面上。
  cardTransactions: [
    { date: "2026-08-11", merchant: "網購/momo購物網", amountTwd: 1250, mcc: "5964" },
    { date: "2026-08-10", merchant: "餐廳/欣葉台菜", amountTwd: 980, mcc: "5812" },
    { date: "2026-08-10", merchant: "速食店/摩斯漢堡", amountTwd: 165, mcc: "5814" },
    { date: "2026-08-09", merchant: "超商/全家便利商店", amountTwd: 125, mcc: "5411" },
    { date: "2026-08-08", merchant: "KKday 行程", amountTwd: 3600, mcc: "4722" },
    { date: "2026-08-07", merchant: "東京希爾頓飯店", amountTwd: 12400, mcc: "7011" },
    { date: "2026-08-06", merchant: "Agoda 訂房", amountTwd: 8200, mcc: "4722" },
    { date: "2026-08-05", merchant: "長榮航空", amountTwd: 18600, mcc: "4511" },
  ],
};
