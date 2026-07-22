import { useEffect, useRef, useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt, rateDecimals } from "../data/format";
import type { FxDatabase, Opportunity } from "../types/fx";

const CCY_LABEL: Record<string, string> = { USD: "美元", JPY: "日圓", CNY: "人民幣" };
const CCY_FLAG: Record<string, string> = { USD: "🇺🇸", JPY: "🇯🇵", CNY: "🇨🇳" };
const QUOTE_SECONDS = 90;

// ============================================================
//  即時報價（敲價）模擬
//  ------------------------------------------------------------
//  真實 App 在使用者輸入金額後，會向後台要一個「效期內鎖定」的
//  兌換匯率（通常比牌告匯率略優，銀行對客戶端在該筆金額、該段
//  時間內用這個價格成交），效期一到就得重新取得報價。這裡用一個
//  固定的優惠價差模擬「敲價」的後台往返，純示範用途、無真實報價
//  來源；效期同樣示範用 90 秒，倒數歸零就要求使用者重新取得匯率，
//  不會偷偷延長或自動套用舊報價。
// ============================================================
type QuoteState = "idle" | "quoting" | "quoted" | "expired";

export function ExchangeScreen({ db, opp, go }: { db: FxDatabase; opp: Opportunity; go: (s: string) => void }) {
  const order = db.fxWatch[0];
  const ccy = order.target_ccy;
  const ccyLabel = CCY_LABEL[ccy] ?? ccy;
  const ccyFlag = CCY_FLAG[ccy] ?? "💱";
  const rate = db.fxRates[ccy];
  const decimals = rateDecimals(ccy);
  const boardRate = rate.bank_sell; // 牌告匯率（本行標準買入價，見 types/fx.ts 說明）

  const agentFilled = opp.state !== "none";
  const [twdAmt, setTwdAmt] = useState(agentFilled ? String(order.amount_twd) : "");
  const [agree, setAgree] = useState(false);

  const [quoteState, setQuoteState] = useState<QuoteState>("idle");
  const [quoteRate, setQuoteRate] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUOTE_SECONDS);
  const pendingAmtRef = useRef<string>(""); // 避免使用者在敲價中又改金額時，舊報價蓋掉新輸入

  function requestQuote(amtStr: string) {
    const amt = Number(amtStr);
    if (!amt || amt <= 0) {
      setQuoteState("idle");
      setQuoteRate(null);
      return;
    }
    setQuoteState("quoting");
    setQuoteRate(null);
    pendingAmtRef.current = amtStr;
    window.setTimeout(() => {
      if (pendingAmtRef.current !== amtStr) return; // 這筆報價已經過時，不套用
      const spreadBp = 12; // 示範用優惠價差：比牌告匯率優惠萬分之12
      const improved = Number((boardRate * (1 - spreadBp / 10000)).toFixed(decimals));
      setQuoteRate(improved);
      setSecondsLeft(QUOTE_SECONDS);
      setQuoteState("quoted");
    }, 900);
  }

  // 代理人已預填金額（從「一鍵授權並執行」跳轉過來）時，一進頁面就先敲一次價。
  useEffect(() => {
    if (twdAmt) requestQuote(twdAmt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 倒數計時：報價效期內每秒遞減，歸零就標記為過期，停止繼續倒數。
  useEffect(() => {
    if (quoteState !== "quoted") return;
    if (secondsLeft <= 0) {
      setQuoteState("expired");
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [quoteState, secondsLeft]);

  function onAmountChange(v: string) {
    const digits = v.replace(/\D/g, "");
    setTwdAmt(digits);
    requestQuote(digits);
  }

  const convertedAmt = quoteRate ? Math.floor(Number(twdAmt) / quoteRate) : 0;
  const twdAccount = db.accounts.find(a => a.ccy === "TWD");
  const canSubmit = agree && quoteState === "quoted";

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px" }}>
        <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: C.lightInk }}>買賣外幣/轉帳</span>
        <span style={{ width: 26 }} />
      </div>

      {/* stepper */}
      <div style={{ display: "flex", padding: "6px 18px 0", gap: 4 }}>
        {["填寫資料","再次確認","交易結果"].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ color: i === 0 ? C.goldDeep : C.lightDim, fontSize: 15, fontWeight: 700 }}>
              <i style={{ fontStyle: "italic", marginRight: 4 }}>{i + 1}</i>{s}
            </span>
          </div>
        ))}
      </div>
      <div style={{ height: 2, background: C.lightLine, margin: "10px 18px 0", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "33%", height: 2, background: C.goldDeep }} />
      </div>

      {/* agent pre-fill notice */}
      {agentFilled && (
        <div style={{ margin: "16px 18px 0", background: "linear-gradient(100deg,#eafaf0,#dff5e8)", border: `1px solid ${C.green}`, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10 }}>
          <Icon d={P.shield} size={20} color="#22A85A" />
          <div style={{ fontSize: 13, color: "#1a7a45", lineHeight: 1.5 }}>
            <b>換匯守衛已為您預填</b>：NT$ {fmt(order.amount_twd)} → {ccyLabel}，正在為您取得即時匯率報價。
          </div>
        </div>
      )}

      {/* trade type */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>交易方式</div>
        <div style={{ display: "flex", border: `1px solid ${C.goldDeep}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ flex: 1, textAlign: "center", padding: "13px 0", background: C.goldDeep, color: "#fff", fontSize: 16, fontWeight: 700 }}>即時換匯</div>
          <div style={{ flex: 1, textAlign: "center", padding: "13px 0", color: C.goldDeep, fontSize: 16, fontWeight: 700 }}>預約/定期定額換匯</div>
        </div>
      </div>

      {/* I want to use */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>我要用</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🇹🇼</span><span style={{ fontSize: 16, color: C.lightInk }}>新臺幣 ▾</span>
          </div>
          <div style={{ flex: 1, border: `1px solid ${agentFilled ? C.green : C.lightLine}`, borderRadius: 10, padding: "6px 12px", background: "#fff", display: "flex", alignItems: "center" }}>
            <input value={twdAmt} onChange={e => onAmountChange(e.target.value)} placeholder="金額"
              style={{ border: "none", outline: "none", width: "100%", textAlign: "right", fontSize: 17, fontWeight: 700, color: C.lightInk, background: "transparent" }} />
            <span style={{ color: C.lightDim, marginLeft: 4 }}>元</span>
          </div>
        </div>
      </div>

      {/* convert to */}
      <div style={{ padding: "16px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>換成</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{ccyFlag}</span><span style={{ fontSize: 16, color: C.lightInk }}>{ccyLabel} ▾</span>
          </div>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", textAlign: "right", fontSize: 17, fontWeight: 700, color: quoteState === "quoted" ? C.lightInk : C.lightDim }}>
            {quoteState === "quoted" ? fmt(convertedAmt) : quoteState === "quoting" ? "敲價中…" : "金額"} <span style={{ color: C.lightDim, fontWeight: 400 }}>元</span>
          </div>
        </div>
      </div>

      {/* rate + info */}
      <div style={{ padding: "18px 18px 0", fontSize: 15, color: C.lightInk }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
          <b>牌告匯率</b><span>{boardRate.toFixed(decimals)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
          <b>兌換匯率</b>
          {quoteState === "quoting" && <span style={{ color: C.lightDim }}>敲價中…</span>}
          {quoteState === "quoted" && <span style={{ color: C.red, fontWeight: 800 }}>{quoteRate!.toFixed(decimals)}</span>}
          {quoteState === "expired" && <span style={{ color: C.red }}>已逾時</span>}
          {quoteState === "idle" && <span style={{ color: C.lightDim }}>請先輸入金額</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${C.lightLine}`, marginTop: 6, paddingTop: 12 }}>
          <b>尚餘交易時間</b>
          {quoteState === "quoted" && (
            <span style={{ color: secondsLeft <= 10 ? C.red : C.lightDim, fontWeight: secondsLeft <= 10 ? 800 : 400 }}>{secondsLeft} 秒</span>
          )}
          {quoteState === "expired" && (
            <button onClick={() => requestQuote(twdAmt)} style={{
              display: "flex", alignItems: "center", gap: 4, border: `1px solid ${C.goldDeep}`, background: "transparent",
              color: C.goldDeep, borderRadius: 8, padding: "5px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}><Icon d={P.refresh} size={13} color={C.goldDeep} />重新取得匯率</button>
          )}
          {(quoteState === "idle" || quoteState === "quoting") && <span style={{ color: C.lightDim }}>—</span>}
        </div>
        {quoteState === "quoted" && (
          <div style={{ fontSize: 11.5, color: C.lightDim, padding: "2px 0 6px" }}>此匯率為本筆交易的即時報價，效期 {QUOTE_SECONDS} 秒，逾期需重新取得。</div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
          <b>結匯性質</b><span style={{ color: C.lightDim }}>常用申報性質 ▾</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><b>交易日期</b><span>{db.today.split("-").join("/")}</span></div>
      </div>

      {/* debit account */}
      <div style={{ padding: "16px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>扣款帳號</div>
        <div style={{ border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, color: C.lightInk }}>{twdAccount?.label ?? "臺幣存款"}</span>
          <span style={{ color: C.lightDim, fontSize: 16 }}>▾</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 2px 0", fontSize: 14 }}>
          <span style={{ color: C.lightDim }}>帳戶餘額</span>
          <span style={{ color: C.lightInk, fontWeight: 700 }}>TWD {fmt(twdAccount?.balance ?? 0)}</span>
        </div>
      </div>

      {/* notice + agree */}
      <div style={{ margin: "16px 18px 0", background: "#fff", borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.lightLine}` }}>
        <div style={{ color: C.red, fontSize: 15, fontWeight: 800, marginBottom: 8 }}>「買賣外幣/轉帳」交易須知</div>
        <div style={{ fontSize: 12.5, color: "#6a6a70", lineHeight: 1.6 }}>
          依中央銀行「外匯收支或交易申報辦法」辦理。申報義務人務請審慎據實申報，申報後除法定情形外不得要求更改。
        </div>
      </div>
      <div onClick={() => setAgree(!agree)} style={{ display: "flex", gap: 10, padding: "14px 20px 0", cursor: "pointer" }}>
        <span style={{ width: 22, height: 22, borderRadius: 5, border: `1.5px solid ${agree ? C.goldDeep : C.lightDim}`, background: agree ? C.goldDeep : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {agree && <Icon d={P.check} size={15} color="#fff" />}
        </span>
        <span style={{ fontSize: 13.5, color: C.lightInk, lineHeight: 1.5 }}>我已清楚知悉「買賣外幣/轉帳」交易須知並同意遵守相關規範。</span>
      </div>

      <div style={{ padding: "18px 18px 26px" }}>
        <button disabled={!canSubmit} onClick={() => go("done")} style={{
          width: "100%", border: "none", borderRadius: 10, padding: "16px 0", fontSize: 18, fontWeight: 800,
          cursor: canSubmit ? "pointer" : "default",
          background: canSubmit ? `linear-gradient(100deg,${C.goldDeep},${C.gold})` : "#bdbdbd", color: canSubmit ? C.ink : "#fff",
        }}>{quoteState === "expired" ? "報價已逾時，請重新取得匯率" : "下一步"}</button>
      </div>
    </div>
  );
}

export function DoneScreen({ db, go }: { db: FxDatabase; go: (s: string) => void }) {
  const order = db.fxWatch[0];
  const ccy = order.target_ccy;
  const ccyLabel = CCY_LABEL[ccy] ?? ccy;
  const sym = { USD: "US$", JPY: "¥", CNY: "¥" }[ccy] ?? ccy;
  const rate = db.fxRates[ccy];
  const decimals = rateDecimals(ccy);
  const convertedAmt = Math.floor(order.amount_twd / rate.bank_sell);
  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 30px", textAlign: "center" }}>
      <div style={{ width: 76, height: 76, borderRadius: 38, background: `linear-gradient(135deg,${C.green},#22A85A)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <Icon d={P.check} size={40} color="#fff" sw={2.4} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.lightInk }}>換匯完成</div>
      <div style={{ fontSize: 15, color: C.lightDim, marginTop: 10, lineHeight: 1.6 }}>
        已為您以 {rate.bank_sell.toFixed(decimals)} 完成換匯（{ccyLabel}）<br />NT$ {fmt(order.amount_twd)} → {sym} {fmt(convertedAmt)}
      </div>
      <div style={{ marginTop: 20, background: "#eafaf0", border: `1px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#1a7a45", lineHeight: 1.5 }}>
        本筆由「換匯守衛」在您授權下於甜蜜點協助完成，較 20 日均價 {rate.ma20.toFixed(decimals)} 節省約 NT$ {fmt(Math.round((rate.ma20 - rate.bank_sell) * convertedAmt))}。
      </div>
      <button onClick={() => go("home")} style={{ marginTop: 26, border: "none", background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink, borderRadius: 10, padding: "14px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>回首頁</button>
    </div>
  );
}
