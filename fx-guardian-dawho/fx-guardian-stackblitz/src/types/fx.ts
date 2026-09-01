// ============================================================
//  Domain types — edit these first when your real schema lands.
//  Everything in the app is typed against this file.
// ============================================================

export type CurrencyCode = "TWD" | "USD" | "JPY" | string;

export interface Account {
  ccy: CurrencyCode;
  label: string;
  balance: number;
  accountNo?: string; // 帳號末幾碼顯示用（換匯「再次確認」頁需要）
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
  settlementPurpose?: string; // 結匯性質（外匯收支或交易申報用途），在 SetupScreen 先填好，
                               // 換匯頁／再次確認頁直接沿用這筆委託的值，不用重填一次。
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
  ownsBiCcyCard: boolean; // 是否已持有永豐幣倍卡——旅遊代理人推薦卡片時，沒有才會顯示「立即申辦」
}

// 信用卡消費紀錄 —— 旅遊財務代理人靠 mcc 判斷是否出現旅遊訊號（見 agent/travelSignal.ts）。
// mcc 只給偵測邏輯用，不會顯示在畫面上。
export interface CardTransaction {
  date: string;      // ISO date，如 "2026-08-05"
  merchant: string;  // 商家名稱（可能已含類別，如「餐廳/優步」），畫面直接顯示這個
  amountTwd: number;
  mcc: string;        // 商店類別代碼（Merchant Category Code），僅供後端／偵測邏輯使用
}

// 旅遊收支報告（旅程結束後）的示範資料——只有一筆寫死的過去行程（見
// mockDb.pastTripReport），讓 Demo 控制台可以直接跳去預覽「旅遊回來後」的畫面
// 長怎樣，跟 TravelAgentScreen 當下產生的建議、實際有沒有跑完旅程無關。
export interface TripReportCategory {
  label: string;
  amountTwd: number;
}

export interface TripReportMerchant {
  merchant: string;
  amountTwd: number;
}

export interface TripReport {
  destinationLabel: string;
  flag: string;
  ccy: CurrencyCode;
  ccyLabel: string;
  startDate: string;
  endDate: string;
  dailyBudget: number;
  totalSpentTwd: number;
  totalSpentForeign: number;
  cashbackTwd: number; // 永豐幣倍卡海外刷卡回饋
  categories: TripReportCategory[]; // 依金額由大到小排列，畫面直接照順序畫長條
  topMerchants: TripReportMerchant[]; // 消費排行 Top3，依金額由大到小排列
  // 以下是報告後半段「正向、鼓勵消費」六個區塊用的資料——全部只是示範用的假資料，
  // 沒有串接真的換匯歷史／消費預測引擎，數字寫死方便先把版面跟語氣定下來。
  remainingForeignAmount: number; // 剩餘外幣運用建議：旅程結束後還沒花完、可以再利用的外幣金額
  fxSavingsTwd: number; // 換匯成本回顧：透過換匯守衛換匯，較一般即期匯率多換得的台幣金額
  predictedNextTripMonth: number; // 下趟旅程預測：依季節樣態預估的月份（1-12）
  dailySpendTwd: number[]; // 每日消費趨勢：依天數排列，加總等於 totalSpentTwd
  cashbackEquivalent: string; // 回饋最大化亮點：把 cashbackTwd 換算成的生活化說法（如「一頓日式晚餐」）
  allMerchants: TripReportMerchant[]; // 消費商家清單：這趟旅程完整的消費足跡，加總等於 totalSpentTwd
}

export interface FxDatabase {
  user: UserProfile;
  accounts: Account[];
  fxRates: Record<CurrencyCode, FxRate>;
  fxWatch: FxOrder[];
  history: FxConversion[];
  cardTransactions: CardTransaction[];
  pastTripReport: TripReport;
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

// 旅遊代理人「建議換匯」卡片交給換匯守衛（SetupScreen）的預填資料——直接帶入
// 幣別、建議外幣金額、觀察區間（今天到出發日，確保出發前完成換匯）與備註，
// 使用者不用在 SetupScreen 重新輸入一次。只支援 db.fxRates 有牌告匯率的幣別
// （目前 USD／JPY）；沒有牌告匯率的目的地（韓國／歐洲）無法交給換匯守衛，
// TravelAgentScreen 會擋掉這個按鈕改用提示文字，請使用者自行到換匯守衛設定。
export interface TravelFxHandoff {
  targetCcy: CurrencyCode;
  suggestedAmountForeign: number;
  suggestedAmountTwd: number;
  windowStart: string;
  windowEnd: string;
  note: string;
  settlementPurpose?: string; // 旅遊情境固定帶「國外觀光支出」，SetupScreen 直接預填，不用重選。
}

// 從 ExchangeScreen（填寫資料）帶到 ConfirmScreen（再次確認）／DoneScreen（交易結果）的
// 快照 —— 「再次確認」看到的必須是使用者剛剛實際敲定的那筆報價，不能重新用當下的
// db.fxRates 反推，否則萬一畫面之間匯率條件變了，三個畫面顯示的數字會兜不起來。
export interface PendingExchange {
  ccy: CurrencyCode;
  twdAmt: number;
  boardRate: number;   // 牌告匯率
  quoteRate: number;   // 敲定的兌換匯率
  convertedAmt: number; // 依 quoteRate 換算的外幣金額
  secondsLeft: number; // 送出確認當下，報價還剩幾秒（ConfirmScreen 接著往下倒數）
  settlementPurpose: string; // 這筆交易的結匯性質，跟著這筆報價快照走，見 FxOrder 的說明
}
