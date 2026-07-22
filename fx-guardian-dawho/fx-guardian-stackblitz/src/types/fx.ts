// ============================================================
//  Domain types — edit these first when your real schema lands.
//  Everything in the app is typed against this file.
// ============================================================

export type CurrencyCode = "TWD" | "USD" | "JPY" | string;

export interface Account {
  ccy: CurrencyCode;
  label: string;
  balance: number;
}

export interface FxRate {
  spot: number;
  bank_buy: number;   // 銀行買入外幣（客戶賣外幣拿到的 TWD）
  bank_sell: number;  // 銀行賣出外幣（客戶用 TWD 買外幣的成交價；越低越有利）
  day_low: number;
  day_high: number;
  ma20: number;       // 20 日均價
}

/**
 * 換匯委託模式：
 *  1 = 觸價執行：達門檻即自動換（全自主）
 *  2 = 區間找低點：區間內 AI 擇低點；到期以當日匯率保證完成
 *  3 = 門檻＋區間：觸價後若仍在區間且 AI 認為可能更低 → 只示警建議、客戶拍板；到期用當日匯率
 */
export type FxMode = 1 | 2 | 3;

/**
 * 門檻方向：targetRate 要「低於（含）」還是「高於（含）」才算觸價。
 * 這個 app 目前只支援 TWD→外幣（買外幣），買外幣時同樣的台幣要換到更多外幣，
 * 買入價（bank_sell）永遠是「越低越有利」——所以現行唯一合理的方向是 "below"。
 * "above" 保留給未來若支援「賣外幣換台幣」（bank_buy 越高越有利）或停損類情境時使用；
 * 目前 SetupScreen 會擋掉 above + 買外幣 的組合，避免設定出「等匯率變貴才觸發」
 * 這種和換匯守衛「在有利時機執行」的初衷相反的委託。
 */
export type TargetDirection = "below" | "above";

export interface FxOrder {
  pair: string;              // e.g. "TWD→USD"
  target_ccy: CurrencyCode;  // 要換入的外幣
  amount_twd: number;
  mode: FxMode;
  targetRate?: number;       // 門檻（模式 1、3）
  targetDirection?: TargetDirection; // 門檻方向，預設 "below"（未設定時視為 below，向下相容舊資料）
  window_start?: string;     // 時間段起（模式 2、3）ISO date
  window_end?: string;       // 時間段迄（模式 2、3）ISO date
  note?: string;
}

export interface FxConversion {
  date: string;
  pair: string;
  rate: number;
  amount: number;
}

export interface UserProfile {
  name: string;
  tier: string;
  memberId: string;
}

export interface FxDatabase {
  user: UserProfile;
  accounts: Account[];
  fxRates: Record<CurrencyCode, FxRate>;
  fxWatch: FxOrder[];
  history: FxConversion[];
  today: string; // ISO date, drives window/expiry logic in the demo
}

// Result of the opportunity evaluation the UI branches on.
export type OppState = "none" | "execute" | "advise";

export interface Opportunity {
  state: OppState;
  hit: boolean;
  rate: number;
  target?: number;
  touched: boolean;
  expired: boolean;
  order?: FxOrder;
}

// Chat message in the agent conversation.
export interface ChatMessage {
  role: "agent" | "user";
  text: string;
}
