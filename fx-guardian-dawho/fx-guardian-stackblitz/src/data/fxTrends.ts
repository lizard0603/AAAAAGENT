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
  indexName: string; // 永豐分析用的完整指數名稱（含幣別說明，給系統提示用）
  pairLabel: string; // 對話中引用時用的簡短貨幣對名稱（如「美元兌日圓」）
  asOf: string; // 資料日期
  latestClose: number;
  bankViewpoint: string; // 永豐 Orbit.AI 給的評等（中性／相對正向…）
  weeklyForecastRange: string; // 永豐預估下週區間
  structure: string; // 均線 / 高低點結構摘要
  resistance: string;
  support: string;
  shortLevels: string; // 支撐/壓力的精簡版（給對話簡短帶入用）
  outlook: string; // 情境展望（守住/跌破關鍵價位分別代表什麼）
}

export const fxTrends: Partial<Record<CurrencyCode, FxTrendSummary>> = {
  USD: {
    indexName: "美元指數",
    pairLabel: "美元指數",
    asOf: "2026-07-22",
    latestClose: 101.2,
    bankViewpoint: "中性",
    weeklyForecastRange: "99.5–101.5",
    structure:
      "現價 101.20 > MA20(101.02) > MA60(99.85) > MA120(99.25)，均線多頭排列，中期偏強；短線在 MA20 上緣高檔整理。",
    resistance: "101.4–101.6 第一層壓力（對應近期高點）；102.0 整數關卡為第二層延伸壓力。",
    support: "100.8–101.0 第一支撐（MA20 附近）；100.2–100.4 第二支撐。",
    shortLevels: "支撐 100.8–101.0、壓力 101.4–101.6",
    outlook:
      "守住 100.8–101.0 → 高檔震盪偏多延續，可望挑戰 101.4–101.6；跌破 101.0 但守住 MA120(99.25) → 屬技術修正而非趨勢反轉；跌破 99.2–99.5（MA120）才代表中期轉弱。",
  },
  JPY: {
    indexName: "美元兌日圓指數（USD/JPY，國際匯率參考，非台幣賣匯）",
    pairLabel: "美元兌日圓",
    asOf: "2026-07-22",
    latestClose: 163.19,
    bankViewpoint: "中性",
    weeklyForecastRange: "160–164",
    structure:
      "現價 163.19 > MA20(162.10) > MA120(158.94)，均線多頭排列（對日圓即走弱），已逼近近 60 日區間高點，尚無反轉訊號。",
    resistance: "163.5–164.0 第一層壓力；165.0 為第二層延伸壓力。",
    support: "162.0–162.2 短線支撐（MA20 附近）；160.5–161.0 第二支撐；158.5–159.0（MA120 附近）為中長期關鍵點位。",
    shortLevels: "支撐 162.0–162.2、壓力 163.5–164.0",
    outlook:
      "守住 162 以上，日圓維持弱勢盤整；若有效跌破 162 並向 159–160（MA120 附近）修正，才代表結構由走弱轉為盤整。",
  },
  CNY: {
    indexName: "美元兌人民幣指數（USD/CNY，國際匯率參考，非台幣賣匯）",
    pairLabel: "美元兌人民幣",
    asOf: "2026-07-22",
    latestClose: 6.7665,
    bankViewpoint: "相對正向（人民幣偏強）",
    weeklyForecastRange: "6.75–6.85",
    structure:
      "現價 6.7665 < MA20(6.7871) < MA60(6.789) < MA120(6.8346)，人民幣對美元中長期偏強，短線在 6.75–6.80 區間整理。",
    resistance: "6.78–6.79 第一層壓力；6.80–6.81 為中長期強弱分水嶺。",
    support: "6.75–6.76 第一支撐；6.73–6.74 第二支撐。",
    shortLevels: "支撐 6.75–6.76、壓力 6.78–6.79",
    outlook:
      "守住 6.75–6.76 且維持在 6.80 之下 → 人民幣中長期偏強格局延續；重新站上 6.80–6.81 → 轉為區間盤整、升值放緩；有效跌破 6.75 → 新一輪升值波段，下一目標 6.73–6.74。",
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

// 對話中簡短帶入用：標明是哪個貨幣對＋支撐壓力價位（精簡、每次都一樣具體但不冗長）。
export function trendShortNote(ccy: CurrencyCode): string {
  const t = fxTrends[ccy];
  if (!t) return "";
  return `${t.pairLabel}：${t.shortLevels}`;
}

// 對話中被追問「為什麼」時用：標明貨幣對＋完整情境展望，作為判斷理由。
export function trendOutlookNote(ccy: CurrencyCode): string {
  const t = fxTrends[ccy];
  if (!t) return "";
  return `${t.pairLabel}走勢：${t.outlook}`;
}
