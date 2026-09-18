import type { CardTransaction } from "../types/fx";

// ============================================================
//  旅遊訊號偵測
//  ------------------------------------------------------------
//  掃過信用卡消費紀錄，用 MCC（Merchant Category Code）判斷有沒有
//  「即將出國」的訊號，回傳訊號最強的那一筆給旅遊代理人的開場白用。
//  MCC 只在這裡（後端／偵測邏輯）使用，不會顯示給使用者——畫面上
//  只會看到翻譯成白話的類別說明（如「機票」），看不到原始代碼。
//
//  強訊號：機票／航空類，最直接代表「要出國了」。
//    4511      Airlines, Air Carriers（一般航空運輸）
//    3000–3350 航空公司專屬代碼區間（部分收單行對特定航空公司的編碼）
//  中等訊號：訂房、飯店、旅行社／行程，本身也可能是純國內消費，
//  優先度低於機票，但仍是合理的旅遊佐證。
//    4722      Travel Agencies and Tour Operators（旅行社／OTA／行程平台）
//    7011      Hotels, Motels, Resorts（飯店住宿）
//    4411      Cruise Lines（郵輪）
// ============================================================

export type TravelSignalStrength = "strong" | "moderate";

export interface TravelSignal {
  transaction: CardTransaction;
  strength: TravelSignalStrength;
  categoryLabel: string; // 白話類別說明，給畫面顯示用（機票／訂房／飯店住宿…）
}

const AIRLINE_RANGE_RE = /^3[0-2]\d\d$|^33[0-4]\d$|^3350$/; // 3000–3350
const MODERATE_MCC: Record<string, string> = {
  "4722": "旅遊行程／訂房",
  "7011": "飯店住宿",
  "4411": "郵輪",
};

function classify(mcc: string): { strength: TravelSignalStrength; categoryLabel: string } | null {
  if (mcc === "4511") return { strength: "strong", categoryLabel: "機票" };
  if (AIRLINE_RANGE_RE.test(mcc)) return { strength: "strong", categoryLabel: "機票" };
  const label = MODERATE_MCC[mcc];
  if (label) return { strength: "moderate", categoryLabel: label };
  return null;
}

// 回傳偵測到的最強訊號那一筆；沒有任何旅遊相關消費就回傳 null。
// 同樣強度時，取日期較新的那一筆（比較貼近「現在」的旅遊計畫）。
export function detectTravelSignal(transactions: CardTransaction[]): TravelSignal | null {
  let best: TravelSignal | null = null;
  for (const tx of transactions) {
    const hit = classify(tx.mcc);
    if (!hit) continue;
    const candidate: TravelSignal = { transaction: tx, strength: hit.strength, categoryLabel: hit.categoryLabel };
    if (!best) {
      best = candidate;
      continue;
    }
    const candidateOutranks =
      (candidate.strength === "strong" && best.strength !== "strong") ||
      (candidate.strength === best.strength && candidate.transaction.date > best.transaction.date);
    if (candidateOutranks) best = candidate;
  }
  return best;
}
