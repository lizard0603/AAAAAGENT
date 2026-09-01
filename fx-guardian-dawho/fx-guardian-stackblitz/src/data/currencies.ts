import type { CurrencyCode } from "../types/fx";

// ============================================================
//  永豐銀行實際承作的外幣幣別——單一資料來源，換匯守衛（SetupScreen）、
//  換匯頁（ExchangeScreen）的幣別選單，以及旅遊小助手（TravelAgentScreen）
//  的目的地選單都從這裡取資料，避免三個地方各自維護一份不一致的清單。
//  country／countryFlag 給「目的地」用；離岸人民幣（CNH）沒有對應的獨立
//  旅遊目的地，只出現在幣別選單，不會出現在國家選單裡。
// ============================================================
export interface CurrencyInfo {
  ccy: CurrencyCode;
  ccyLabel: string;   // 幣別中文名稱，如「美金」
  flag: string;       // 幣別／國家共用的旗幟 emoji
  country?: string;   // 代表性國家／地區名稱，給旅遊小助手的目的地選單用
}

export const SINOPAC_CURRENCIES: CurrencyInfo[] = [
  { ccy: "USD", ccyLabel: "美金", flag: "🇺🇸", country: "美國" },
  { ccy: "GBP", ccyLabel: "英鎊", flag: "🇬🇧", country: "英國" },
  { ccy: "HKD", ccyLabel: "港幣", flag: "🇭🇰", country: "香港" },
  { ccy: "CHF", ccyLabel: "瑞士法郎", flag: "🇨🇭", country: "瑞士" },
  { ccy: "AUD", ccyLabel: "澳幣", flag: "🇦🇺", country: "澳洲" },
  { ccy: "SGD", ccyLabel: "新加坡幣", flag: "🇸🇬", country: "新加坡" },
  { ccy: "JPY", ccyLabel: "日圓", flag: "🇯🇵", country: "日本" },
  { ccy: "SEK", ccyLabel: "瑞典幣", flag: "🇸🇪", country: "瑞典" },
  { ccy: "CAD", ccyLabel: "加拿大幣", flag: "🇨🇦", country: "加拿大" },
  { ccy: "ZAR", ccyLabel: "南非幣", flag: "🇿🇦", country: "南非" },
  { ccy: "EUR", ccyLabel: "歐元", flag: "🇪🇺", country: "歐洲" },
  { ccy: "NZD", ccyLabel: "紐西蘭幣", flag: "🇳🇿", country: "紐西蘭" },
  { ccy: "CNY", ccyLabel: "人民幣", flag: "🇨🇳", country: "中國" },
  { ccy: "CNH", ccyLabel: "離岸人民幣", flag: "🇨🇳" },
];

export const CCY_LABEL: Record<string, string> = Object.fromEntries(
  SINOPAC_CURRENCIES.map(c => [c.ccy, c.ccyLabel])
);
export const CCY_FLAG: Record<string, string> = Object.fromEntries(
  SINOPAC_CURRENCIES.map(c => [c.ccy, c.flag])
);

export function findCurrency(ccy: CurrencyCode): CurrencyInfo | undefined {
  return SINOPAC_CURRENCIES.find(c => c.ccy === ccy);
}
