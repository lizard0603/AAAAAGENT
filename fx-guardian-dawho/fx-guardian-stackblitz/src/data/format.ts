import type { CurrencyCode } from "../types/fx";

export const fmt = (n: number, d = 0) =>
  n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

export const CCY_SYMBOL: Record<CurrencyCode, string> = {
  TWD: "NT$",
  USD: "US$",
  JPY: "¥",
};
