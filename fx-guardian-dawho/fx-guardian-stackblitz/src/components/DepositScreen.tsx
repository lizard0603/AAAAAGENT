import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt } from "../data/format";
import { CCY_LABEL } from "../data/currencies";
import type { DepositPrefill, FxDatabase, PendingDeposit } from "../types/fx";

// ============================================================
//  新增定存（外幣優利定存）—— 從旅遊收支報告「轉入外幣運用建議」的
//  「轉入外幣優利定存」按鈕進來，比照永豐實際「新增定存」頁的欄位與
//  三步驟（填寫資料／再次確認／交易結果），跟 ExchangeScreen 那組
//  三步驟畫面是同一種模式。
// ============================================================

const PERIODS = ["1個月", "3個月", "6個月", "9個月", "1年"];
const DEPOSIT_TYPES = ["整存整付", "零存整付", "存本取息"];
const INTEREST_METHODS = ["機動利率", "固定利率"];
const RENEWAL_OPTIONS = ["原金額自動續存", "到期解約，本利歸入原帳戶"];

// 示範用參考利率——依幣別給一個基準年息，期別長短做小幅微調，只是讓「參考利率」
// 欄位有數字可看，不是真的牌告利率表。
const BASE_RATE: Record<string, number> = {
  USD: 4.05, GBP: 3.6, HKD: 2.2, CHF: 0.4, AUD: 3.9, SGD: 2.6,
  JPY: 0.2, SEK: 1.6, CAD: 3.2, ZAR: 6.8, EUR: 2.6, NZD: 3.5, CNY: 1.3, CNH: 1.3,
};
const PERIOD_ADJUST: Record<string, number> = { "1個月": -0.15, "3個月": 0, "6個月": -0.05, "9個月": -0.1, "1年": -0.2 };
function estimateRate(ccy: string, period: string): number {
  const base = BASE_RATE[ccy] ?? 1.5;
  return Math.max(0.05, Math.round((base + (PERIOD_ADJUST[period] ?? 0)) * 100) / 100);
}

const STEPS = ["填寫資料", "再次確認", "交易結果"];
function Stepper({ activeIdx }: { activeIdx: 0 | 1 | 2 }) {
  return (
    <>
      <div style={{ display: "flex", padding: "6px 18px 0", gap: 4 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ color: i === activeIdx ? C.goldDeep : C.lightDim, fontSize: 15, fontWeight: 700 }}>
              <i style={{ fontStyle: "italic", marginRight: 4 }}>{i + 1}</i>{s}
            </span>
          </div>
        ))}
      </div>
      <div style={{ height: 2, background: C.lightLine, margin: "10px 18px 0", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: `${((activeIdx + 1) / 3) * 100}%`, height: 2, background: C.goldDeep }} />
      </div>
    </>
  );
}

export function DepositScreen({ db, go, prefill, onSubmit }: {
  db: FxDatabase; go: (s: string) => void; prefill: DepositPrefill | null; onSubmit: (d: PendingDeposit) => void;
}) {
  const account = db.accounts.find(a => a.ccy === prefill?.ccy) ?? db.accounts.find(a => a.ccy !== "TWD") ?? null;
  const ccy = account?.ccy ?? prefill?.ccy ?? "USD";
  const ccyLabel = CCY_LABEL[ccy] ?? ccy;

  const [name, setName] = useState("我的定存單");
  const [period, setPeriod] = useState("");
  const [depositType, setDepositType] = useState("");
  const [amount, setAmount] = useState(prefill ? String(Math.round(prefill.amountForeign)) : "");
  const [interestMethod, setInterestMethod] = useState("");
  const [renewal, setRenewal] = useState("");
  const [error, setError] = useState("");

  const rate = period ? estimateRate(ccy, period) : null;
  const canSubmit = !!(account && name.trim() && period && depositType && Number(amount) > 0 && interestMethod && renewal);

  function submit() {
    if (!canSubmit || !account) return setError("請完整填寫所有必填欄位。");
    setError("");
    onSubmit({
      name: name.trim(), ccy, accountLabel: account.label, accountNo: account.accountNo ?? "",
      period, depositType, amount: Number(amount), interestMethod, rate: rate ?? 0, renewal,
    });
  }

  const selectStyle = (filled: boolean) => ({
    width: "100%", appearance: "none" as const, cursor: "pointer",
    border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 34px 13px 14px",
    background: filled ? "#fff" : "#efece5", color: filled ? C.lightInk : C.lightDim, fontSize: 14, fontWeight: 600,
  });

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px" }}>
        <span onClick={() => go("tripReport")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: C.lightInk }}>新增定存</span>
        <span style={{ width: 26 }} />
      </div>

      <Stepper activeIdx={0} />

      {/* 活動快訊 */}
      <div style={{ margin: "16px 18px 0", background: "#fbf2df", border: `1px solid ${C.gold}`, borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: "#6a5a30", lineHeight: 1.7 }}>
        <b>【2026/9/30前自然人外幣優利定存快訊】</b> 美元3個月期年息4.05%、人民幣6個月期最高1.30%，活動限制及其他優惠方案請詳閱本行活動網頁！
        {" "}<span style={{ color: C.goldDeep, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>活動詳情</span>
      </div>

      {/* 定存名稱 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>定存名稱</div>
        <input value={name} onChange={e => setName(e.target.value)}
          style={{ width: "100%", border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", fontSize: 15, color: C.lightInk, outline: "none" }} />
      </div>

      {/* 扣款帳號 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>扣款帳號</div>
        {account ? (
          <div style={{ border: `1px solid ${C.goldDeep}`, borderRadius: 10, padding: "13px 14px", background: "#fbf2df" }}>
            <span style={{ fontSize: 15, color: C.goldDeep, fontWeight: 700 }}>{account.label}（{ccyLabel}）{account.accountNo}</span>
          </div>
        ) : (
          <div style={{ border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#efece5", color: C.lightDim, fontSize: 14 }}>
            請選擇轉出帳號
          </div>
        )}
      </div>

      {/* 帳戶餘額 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>帳戶餘額</div>
        <div style={{ borderTop: `1px solid ${C.lightLine}`, paddingTop: 10, textAlign: "right", fontSize: 15, color: C.lightInk, fontWeight: 700 }}>
          {account ? `${ccyLabel} ${fmt(account.balance)}` : "－"}
        </div>
      </div>

      {/* 期別 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>期別</div>
        <div style={{ position: "relative" }}>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={selectStyle(!!period)}>
            <option value="" disabled>請選擇期別</option>
            {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon d={P.chevDown} size={13} color={C.lightDim} />
          </div>
        </div>
      </div>

      {/* 存款種類 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>存款種類</div>
        <div style={{ position: "relative" }}>
          <select value={depositType} onChange={e => setDepositType(e.target.value)} style={selectStyle(!!depositType)}>
            <option value="" disabled>請選擇存款種類</option>
            {DEPOSIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon d={P.chevDown} size={13} color={C.lightDim} />
          </div>
        </div>
      </div>

      {/* 扣款金額 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>扣款金額</div>
        <div style={{ border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", display: "flex", alignItems: "center" }}>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="請輸入金額"
            style={{ border: "none", outline: "none", flex: 1, fontSize: 17, fontWeight: 700, color: C.lightInk, background: "transparent" }} />
          <span style={{ color: C.lightDim }}>{ccyLabel}</span>
        </div>
      </div>

      {/* 計息方式 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>計息方式</div>
        <div style={{ position: "relative" }}>
          <select value={interestMethod} onChange={e => setInterestMethod(e.target.value)} style={selectStyle(!!interestMethod)}>
            <option value="" disabled>請選擇計息方式</option>
            {INTEREST_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon d={P.chevDown} size={13} color={C.lightDim} />
          </div>
        </div>
      </div>

      {/* 參考利率 */}
      <div style={{ padding: "18px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: C.lightInk }}>參考利率</span>
        <span style={{ fontSize: 12.5, color: C.red, textAlign: "right" }}>
          {rate != null && <b style={{ marginRight: 6 }}>年息 {rate.toFixed(2)}%</b>}
          {rate == null && <b style={{ marginRight: 6 }}>－</b>}
          實際利率依本行利率為準
        </span>
      </div>

      {/* 到期續存 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 10 }}>到期續存</div>
        <div style={{ position: "relative" }}>
          <select value={renewal} onChange={e => setRenewal(e.target.value)} style={selectStyle(!!renewal)}>
            <option value="" disabled>請選擇是否續存</option>
            {RENEWAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon d={P.chevDown} size={13} color={C.lightDim} />
          </div>
        </div>
      </div>

      <div style={{ margin: "18px 18px 0", fontSize: 12, color: C.red, lineHeight: 1.7 }}>
        小提醒：假日無法解約定存、存單到期日如遇假日將延至營業日入帳，詳細內容可參考下方注意事項。
      </div>

      {error && <div style={{ margin: "14px 18px 0", color: C.red, fontSize: 13, fontWeight: 600 }}>{error}</div>}

      <div style={{ padding: "20px 18px 26px" }}>
        <button disabled={!canSubmit} onClick={submit} style={{
          width: "100%", border: "none", borderRadius: 10, padding: "16px 0", fontSize: 18, fontWeight: 800,
          cursor: canSubmit ? "pointer" : "default",
          background: canSubmit ? `linear-gradient(100deg,${C.goldDeep},${C.gold})` : "#bdbdbd", color: canSubmit ? C.ink : "#fff",
        }}>確定</button>
      </div>
    </div>
  );
}

export function DepositConfirmScreen({ pending, go, onSubmit }: {
  pending: PendingDeposit; go: (s: string) => void; onSubmit: () => void;
}) {
  const ccyLabel = CCY_LABEL[pending.ccy] ?? pending.ccy;
  const rows: [string, string][] = [
    ["定存名稱", pending.name],
    ["扣款帳號", `${pending.accountLabel}（${ccyLabel}）${pending.accountNo}`],
    ["扣款金額", `${ccyLabel} ${fmt(pending.amount)}`],
    ["期別", pending.period],
    ["存款種類", pending.depositType],
    ["計息方式", pending.interestMethod],
    ["參考利率", `年息 ${pending.rate.toFixed(2)}%`],
    ["到期續存", pending.renewal],
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px" }}>
        <span onClick={() => go("deposit")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: C.lightInk }}>請確認以下資料</span>
        <span style={{ width: 26 }} />
      </div>

      <Stepper activeIdx={1} />

      <div style={{ margin: "16px 18px 0", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.lightLine}` }}>
        {rows.map(([label, value], i) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 16px", background: i % 2 === 0 ? "#f0eee9" : "#fff" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.lightInk, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 15, color: C.lightInk, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 18px 26px" }}>
        <button onClick={onSubmit} style={{
          width: "100%", border: "none", borderRadius: 10, padding: "16px 0", fontSize: 18, fontWeight: 800, cursor: "pointer",
          background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink,
        }}>確認送出</button>
      </div>
    </div>
  );
}

export function DepositDoneScreen({ pending, go }: { pending: PendingDeposit | null; go: (s: string) => void }) {
  const ccyLabel = pending ? (CCY_LABEL[pending.ccy] ?? pending.ccy) : "";
  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 30px", textAlign: "center" }}>
      <div style={{ width: 76, height: 76, borderRadius: 38, background: `linear-gradient(135deg,${C.green},#22A85A)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <Icon d={P.check} size={40} color="#fff" sw={2.4} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.lightInk }}>定存申請已送出</div>
      {pending && (
        <div style={{ fontSize: 15, color: C.lightDim, marginTop: 10, lineHeight: 1.6 }}>
          已為您將 {ccyLabel} {fmt(pending.amount)} 轉入「{pending.name}」<br />
          期別 {pending.period}・年息 {pending.rate.toFixed(2)}%
        </div>
      )}
      <button onClick={() => go("home")} style={{ marginTop: 26, border: "none", background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink, borderRadius: 10, padding: "14px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>回首頁</button>
    </div>
  );
}
