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

export interface FxOrder {
  pair: string;              // e.g. "TWD→USD"
  target_ccy: CurrencyCode;  // 要換入的外幣
  amount_twd: number;
  mode: FxMode;
  targetRate?: number;       // 門檻（模式 1、3）
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
  order: FxOrder;
}

// Chat message in the agent conversation.
export interface ChatMessage {
  role: "agent" | "user";
  text: string;
}
