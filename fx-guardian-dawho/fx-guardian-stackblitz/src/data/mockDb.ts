import type { FxDatabase } from "../types/fx";

// ============================================================
//  MOCK DATABASE — replace with real data when ready.
//  Demo tuned so mode 3 lands in "advise" (示警建議) state.
// ============================================================
export const mockDb: FxDatabase = {
  today: "2026-07-15",
  // ownsBiCcyCard: false，示範旅遊代理人推薦「永豐幣倍卡」時「立即申辦」按鈕會出現。
  user: { name: "洪先生", tier: "DAWHO 大戶", memberId: "SP-88031", ownsBiCcyCard: false },
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
  // AIRASIA_AK（機票，強訊號）跟 Trip.com（訂房／行程，中等訊號）是「即將出國」的
  // 佐證，其餘是日常消費當背景雜訊，用來測 agent/travelSignal.ts 的
  // detectTravelSignal() 有沒有正確只挑出旅遊訊號、忽略無關消費——這裡強訊號
  // AIRASIA_AK 日期較舊，中等訊號 Trip.com 日期較新，用來驗證「強訊號優先於日期」
  // 的排序規則。mcc 只給偵測邏輯用，不顯示在畫面上。
  cardTransactions: [
    { date: "2026-08-11", merchant: "連支*麥味登__北市合江", amountTwd: 220, mcc: "5814" },
    { date: "2026-08-10", merchant: "Trip.com LondonGB", amountTwd: 18728, mcc: "4722" },
    { date: "2026-08-10", merchant: "餐廳/優食", amountTwd: 199, mcc: "5812" },
    { date: "2026-08-09", merchant: "速食店/CAMA", amountTwd: 80, mcc: "5814" },
    { date: "2026-08-07", merchant: "AIRASIA_AK", amountTwd: 20035, mcc: "4511" },
  ],
  // 「旅遊收支報告」畫面的示範資料——一趟已經結束的日本行程，只給 Demo 控制台的
  // 「查看旅遊回來後的畫面」入口用，跟上面 cardTransactions／旅遊代理人現算的建議
  // 無關（那是「出發前」的情境，這筆是「回國後」的情境）。
  pastTripReport: {
    destinationLabel: "日本", flag: "🇯🇵", ccy: "JPY", ccyLabel: "日圓",
    startDate: "2026-06-10", endDate: "2026-06-15", dailyBudget: 2000,
    totalSpentTwd: 13850, totalSpentForeign: 68700, cashbackTwd: 485,
    categories: [
      { label: "住宿", amountTwd: 4600 },
      { label: "餐飲", amountTwd: 3920 },
      { label: "購物", amountTwd: 2980 },
      { label: "交通", amountTwd: 1850 },
      { label: "其他", amountTwd: 500 },
    ],
    topMerchants: [
      { merchant: "東京希爾頓飯店", amountTwd: 4600 },
      { merchant: "BicCamera 新宿東口店", amountTwd: 1980 },
      { merchant: "一蘭拉麵 新宿店", amountTwd: 620 },
    ],
  },
};
