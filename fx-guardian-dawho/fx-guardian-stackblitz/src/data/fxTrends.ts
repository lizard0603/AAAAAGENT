import type { CurrencyCode } from "../types/fx";

// ============================================================
//  外部市場參考：永豐銀行 Orbit.AI「投資水晶球」外匯趨勢分析
//  ------------------------------------------------------------
//  來源：https://bank.sinopac.com/sinopacBT/webevents/orbitai/
//  （該頁面本身是行銷入口，實際趨勢內容由其內部 API 動態載入，
//   端點與請求格式見 scripts/fetch-fx-trends.mjs）
//
//  這是「該幣別對美元」的國際匯率指數走勢判讀（如美元指數、
//  USD/JPY、USD/CNY），不是本行台幣兌外幣的牌告賣匯，兩者不能
//  直接畫等號 —— 這裡只作為研判「該外幣對美元強弱脈絡」的輔助
//  色彩，換匯守衛做判斷時仍須以 fxRates（台幣牌告價）為準。
//
//  這是人工擷取的某時間點快照，非即時串接；要更新內容，重新執行
//  scripts/fetch-fx-trends.mjs 抓取最新回應後手動回填即可。
// ============================================================

export interface FxTrendSummary {
  indexName: string; // 永豐分析用的指數名稱（如「美元指數」）
  asOf: string; // 資料日期
  latestClose: number;
  bankViewpoint: string; // 永豐 Orbit.AI 給的評等（中性／相對正向…）
  weeklyForecastRange: string; // 永豐預估下週區間
  structure: string; // 均線 / 高低點結構摘要
  resistance: string;
  support: string;
  outlook: string; // 情境展望（守住/跌破關鍵價位分別代表什麼）
}

export const fxTrends: Partial<Record<CurrencyCode, FxTrendSummary>> = {
  USD: {
    indexName: "美元指數",
    asOf: "2026-07-21",
    latestClose: 100.6,
    bankViewpoint: "中性（近期由偏鴿上調）",
    weeklyForecastRange: "99.5–101.5",
    structure:
      "現價高於 MA60(99.74)、MA120(99.16)，中期偏多排列；但略低於 MA20(101.06)，短線處於高檔區間整理。",
    resistance: "101.0–101.2 第一關卡；101.4–101.6 為近兩個月高檔核心壓力區。",
    support: "100.3–100.4 短線上升趨勢線；99.7–99.8 為 MA60 附近關鍵支撐。",
    outlook:
      "守住 100.3 並重返 101 之上 → 短線整理結束、中期偏多延續；若跌破 99.7–99.8，短中期動能轉弱訊號浮現。",
  },
  JPY: {
    indexName: "美元兌日圓指數（USD/JPY，國際匯率參考，非台幣賣匯）",
    asOf: "2026-07-21",
    latestClose: 162.51,
    bankViewpoint: "中性",
    weeklyForecastRange: "160–164",
    structure:
      "現價 162.51 > MA20(162.05) > MA60(160.10) > MA120(158.89)，均線多頭排列，日圓對美元持續走弱、尚無反轉訊號。",
    resistance: "162.8–163.0 短線壓力區。",
    support: "161.8–162.0 短線支撐；160.0–160.5（MA60 附近）與 158.8–159.0（MA120 附近）為中長期關鍵點位。",
    outlook:
      "守住 161.8 以上，日圓維持弱勢盤整；若跌破 161.8 為短線走強第一訊號，回落至 160 附近才代表中期轉強。",
  },
  CNY: {
    indexName: "美元兌人民幣指數（USD/CNY，國際匯率參考，非台幣賣匯）",
    asOf: "2026-07-21",
    latestClose: 6.7671,
    bankViewpoint: "相對正向（人民幣偏強）",
    weeklyForecastRange: "6.75–6.85",
    structure:
      "現價 6.7671 < MA20(6.7875) < MA120(6.8361)，人民幣對美元中期由弱轉強，短線在 6.77–6.80 區間整理，走強動能略見趨緩。",
    resistance: "6.78–6.80 短線壓力（人民幣走弱訊號）；6.82–6.84 中長期壓力。",
    support: "6.75–6.76 短線支撐，為人民幣走強防線。",
    outlook:
      "跌破 6.75 → 人民幣續強格局可望延伸；重新站上 6.80 → 動能減弱，轉入橫盤甚至走弱。",
  },
};

export function formatTrendReference(ccy: CurrencyCode): string {
  const t = fxTrends[ccy];
  if (!t) return "";
  return [
    `【${t.indexName}】資料日期 ${t.asOf}，最新收盤 ${t.latestClose}，永豐評等：${t.bankViewpoint}，預估區間 ${t.weeklyForecastRange}`,
    `結構：${t.structure}`,
    `壓力：${t.resistance}｜支撐：${t.support}`,
    `展望：${t.outlook}`,
  ].join("\n");
}
