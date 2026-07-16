import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import type { FxDatabase, Opportunity } from "../types/fx";

const fmt = (n: number, d = 0) => n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

export function ExchangeScreen({ db, opp, go }: { db: FxDatabase; opp: Opportunity; go: (s: string) => void }) {
  const order = db.fxWatch[0];
  const usd = db.fxRates.USD;
  const agentFilled = opp.state !== "none";
  const [twdAmt, setTwdAmt] = useState(agentFilled ? String(order.amount_twd) : "");
  const [agree, setAgree] = useState(false);
  const usdAmt = twdAmt ? Math.floor(Number(twdAmt) / usd.bank_sell) : 0;

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
            <b>換匯守衛已為您預填</b>：NT$ {fmt(order.amount_twd)} → 美元，以目前 {usd.bank_sell} 試算約 US$ {fmt(usdAmt)}。請確認後送出。
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
            <input value={twdAmt} onChange={e => setTwdAmt(e.target.value.replace(/\D/g, ""))} placeholder="金額"
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
            <span style={{ fontSize: 18 }}>🇺🇸</span><span style={{ fontSize: 16, color: C.lightInk }}>美金 ▾</span>
          </div>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "13px 14px", background: "#fff", textAlign: "right", fontSize: 17, fontWeight: 700, color: agentFilled ? C.lightInk : C.lightDim }}>
            {usdAmt ? fmt(usdAmt) : "金額"} <span style={{ color: C.lightDim, fontWeight: 400 }}>元</span>
          </div>
        </div>
      </div>

      {/* rate + info */}
      <div style={{ padding: "18px 18px 0", fontSize: 15, color: C.lightInk }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><b>兌換匯率</b><span>{usd.bank_sell}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.lightLine}`, marginTop: 6, paddingTop: 12 }}>
          <b>結匯性質</b><span style={{ color: C.lightDim }}>常用申報性質 ▾</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><b>交易日期</b><span>2026/07/15</span></div>
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
        <button disabled={!agree} onClick={() => go("done")} style={{
          width: "100%", border: "none", borderRadius: 10, padding: "16px 0", fontSize: 18, fontWeight: 800,
          cursor: agree ? "pointer" : "default",
          background: agree ? `linear-gradient(100deg,${C.goldDeep},${C.gold})` : "#bdbdbd", color: agree ? C.ink : "#fff",
        }}>下一步</button>
      </div>
    </div>
  );
}

export function DoneScreen({ db, go }: { db: FxDatabase; go: (s: string) => void }) {
  const order = db.fxWatch[0];
  const usd = db.fxRates.USD;
  const usdAmt = Math.floor(order.amount_twd / usd.bank_sell);
  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 30px", textAlign: "center" }}>
      <div style={{ width: 76, height: 76, borderRadius: 38, background: `linear-gradient(135deg,${C.green},#22A85A)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <Icon d={P.check} size={40} color="#fff" sw={2.4} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.lightInk }}>換匯完成</div>
      <div style={{ fontSize: 15, color: C.lightDim, marginTop: 10, lineHeight: 1.6 }}>
        已為您以 {usd.bank_sell} 完成換匯<br />NT$ {fmt(order.amount_twd)} → US$ {fmt(usdAmt)}
      </div>
      <div style={{ marginTop: 20, background: "#eafaf0", border: `1px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#1a7a45", lineHeight: 1.5 }}>
        本筆由「換匯守衛」在您授權下於甜蜜點協助完成，較 20 日均價 {usd.ma20} 節省約 NT$ {fmt(Math.round((usd.ma20 - usd.bank_sell) * usdAmt))}。
      </div>
      <button onClick={() => go("home")} style={{ marginTop: 26, border: "none", background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink, borderRadius: 10, padding: "14px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>回首頁</button>
    </div>
  );
}
