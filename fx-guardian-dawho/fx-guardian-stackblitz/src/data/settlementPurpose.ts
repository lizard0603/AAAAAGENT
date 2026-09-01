// ============================================================
//  結匯性質（外匯收支或交易申報用途）——常用申報項目的示範清單。
//  預設值刻意跟旅遊情境對齊，因為這個 app 目前最主要的換匯情境
//  就是旅遊小助手帶過來的委託；SetupScreen 選一次，ExchangeScreen／
//  ConfirmScreen 就直接沿用，不用重填（見 types/fx.ts 的欄位說明）。
// ============================================================
export const SETTLEMENT_PURPOSES: string[] = [
  "國外觀光支出（含遊學、旅行社團費）",
  "商務出差費用",
  "海外親屬生活費／教育費",
  "留學教育費用",
  "海外投資／置產",
  "其他",
];

export const DEFAULT_SETTLEMENT_PURPOSE = SETTLEMENT_PURPOSES[0];
