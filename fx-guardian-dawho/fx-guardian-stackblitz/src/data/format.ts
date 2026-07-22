import type { CurrencyCode } from "../types/fx";

export const fmt = (n: number, d = 0) =>
  n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

export const CCY_SYMBOL: Record<CurrencyCode, string> = {
  TWD: "NT$",
  USD: "US$",
  JPY: "¥",
};

// 匯率本身該顯示到第幾位小數（JPY 是「每 1 圓兌台幣」，數字量級小，位數要多一些；
// 差距試算、即時報價都要照這個位數算，不然像 JPY 用 2 位小數幾乎永遠只會顯示 0.00）。
const RATE_DECIMALS: Record<string, number> = { JPY: 4, USD: 3, CNY: 2 };
export const rateDecimals = (ccy: CurrencyCode) => RATE_DECIMALS[ccy] ?? 2;
