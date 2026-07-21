import { useEffect, useRef, useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { askFxGuardian } from "../agent/fxGuardian";
import type { FxDatabase, FxOrder, Opportunity, ChatMessage } from "../types/fx";

const fmt = (n: number, d = 0) => n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });
const CCY_LABEL: Record<string, string> = { USD: "美元", JPY: "日圓", CNY: "人民幣" };

export function AgentScreen({ db, opp, go, orders, activeIdx, onSwitchOrder, onCancelOrder, onAddAnother }: {
  db: FxDatabase; opp: Opportunity; go: (s: string) => void;
  orders: FxOrder[]; activeIdx: number;
  onSwitchOrder: (i: number) => void; onCancelOrder: () => void; onAddAnother: () => void;
}) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [decided, setDecided] = useState<null | "lock" | "wait">(null);
  const ref = useRef<HTMLDivElement>(null);
  const order = db.fxWatch[0];
  const ccyLabel = CCY_LABEL[order.target_ccy] ?? order.target_ccy;
  const primaryRate = db.fxRates[order.target_ccy];
  const refCcy = order.target_ccy === "USD" ? "JPY" : "USD";
  const refRate = db.fxRates[refCcy];
  const primarySub = order.targetRate != null ? `目標 ${order.targetRate}` : order.window_end ? `區間至 ${order.window_end}` : `20日均 ${primaryRate.ma20}`;

  useEffect(() => {
    setMsgs([]);
    setDecided(null);
    (async () => {
      setLoading(true);
      const opener = opp.state === "advise"
        ? "（系統：已觸及客戶設定的條件但仍在觀察區間內。只示警＋建議，把是否鎖定的決定權交給客戶，不可自動換。給換匯試算與觀望利弊。）"
        : opp.state === "execute"
        ? "（系統：已達執行條件，說明可授權即執行並給試算。）"
        : "（系統：客戶打開換匯守衛，簡短彙報目前匯率相對條件的狀況與差距。）";
      try { setMsgs([{ role: "agent", text: await askFxGuardian(db, opp, opener) }]); }
      catch (e: any) { setMsgs([{ role: "agent", text: `（連線異常：${e?.message ?? e}）` }]); }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight); }, [msgs, loading]);

  async function send(t: string) {
    if (!t.trim()) return;
    const next: ChatMessage[] = [...msgs, { role: "user", text: t }];
    setMsgs(next); setInput(""); setLoading(true);
    try { setMsgs([...next, { role: "agent", text: await askFxGuardian(db, opp, t, msgs) }]); }
    catch (e: any) { setMsgs([...next, { role: "agent", text: `（連線異常：${e?.message ?? e}）` }]); }
    setLoading(false);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
        <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={P.shield} size={22} color={C.goldLt} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>換匯守衛</div>
          <div style={{ fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green }} /> 即時監控中
          </div>
        </div>
      </div>

      {orders.length > 1 && (
        <div style={{ display: "flex", gap: 8, padding: "12px 18px 0", overflowX: "auto" }}>
          {orders.map((o, i) => (
            <button key={i} onClick={() => onSwitchOrder(i)} style={{
              flexShrink: 0, border: `1px solid ${i === activeIdx ? C.goldDeep : C.line}`, borderRadius: 20,
              padding: "6px 14px", background: i === activeIdx ? "rgba(201,161,90,.18)" : "transparent",
              color: i === activeIdx ? C.goldLt : C.textDim, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>{CCY_LABEL[o.target_ccy] ?? o.target_ccy} · {fmt(o.amount_twd)} · 模式{o.mode}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, padding: "12px 18px 0" }}>
        {[[`${ccyLabel} 買入`, primaryRate.bank_sell, primarySub, opp.state !== "none"],
          [`${CCY_LABEL[refCcy] ?? refCcy} 買入`, refRate.bank_sell, `20日均 ${refRate.ma20}`, false]].map(([a, b, c, hl], i) => (
          <div key={i} style={{ flex: 1, background: C.bgDeep, borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: C.textDim }}>{a as string}</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: hl ? C.green : C.goldLt }}>{b as any}</div>
            <div style={{ fontSize: 10, color: C.textDim }}>{c as string}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 18px 0" }}>
        <button onClick={onCancelOrder} style={{
          flex: 1, border: `1px solid ${C.line}`, background: "transparent", color: C.textDim,
          borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        }}>取消此委託</button>
        <button onClick={onAddAnother} style={{
          flex: 1, border: `1px solid ${C.goldDeep}`, background: "transparent", color: C.goldLt,
          borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        }}>+ 再設定一筆</button>
      </div>

      <div ref={ref} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "16px 18px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end", justifyContent: m.role === "agent" ? "flex-start" : "flex-end" }}>
            {m.role === "agent" && <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon d={P.shield} size={15} color={C.goldLt} /></div>}
            <div style={{ maxWidth: "78%", padding: "11px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
              ...(m.role === "agent" ? { background: C.card, color: C.text, borderBottomLeftRadius: 4 } : { background: C.gold, color: C.ink, borderBottomRightRadius: 4, fontWeight: 500 }) }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: C.textDim, fontStyle: "italic", fontSize: 13, paddingLeft: 36 }}>正在分析匯率…</div>}

        {opp.state === "advise" && !decided && !loading && msgs.length > 0 && (
          <div style={{ background: "rgba(201,161,90,.1)", border: `1px solid ${C.gold}`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, color: C.ink, background: C.gold, borderRadius: 8, padding: "3px 9px", marginBottom: 9 }}>需您決定 · AI 僅提供建議</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginBottom: 12 }}>
              {order.targetRate != null ? `已達門檻 ${order.targetRate}` : `已低於 20 日均價 ${primaryRate.ma20}`}（目前 {primaryRate.bank_sell}），仍在您的區間內。是否現在鎖定，或再觀望？
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDecided("lock"); go("exchange"); }} style={{ flex: 1, padding: "11px 8px", borderRadius: 11, border: "none", background: C.gold, color: C.ink, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>現在鎖定換匯</button>
              <button onClick={() => setDecided("wait")} style={{ flex: 1, padding: "11px 8px", borderRadius: 11, background: "transparent", color: C.gold, border: `1px solid ${C.goldDeep}`, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>再觀望</button>
            </div>
          </div>
        )}
        {decided === "wait" && <div style={{ background: C.bgDeep, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 16px", color: C.textDim, fontSize: 12.5, lineHeight: 1.5 }}>◷ 已為您繼續監控。到期日 {order.window_end} 前若未再指示，將以當日匯率保證完成。</div>}
      </div>

      <div style={{ padding: "10px 18px 14px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)}
            placeholder="問問換匯守衛…" style={{ flex: 1, background: C.bgDeep, border: `1px solid ${C.line}`, borderRadius: 22, padding: "12px 16px", color: C.text, fontSize: 13, outline: "none" }} />
          <button onClick={() => send(input)} style={{ width: 44, height: 44, borderRadius: 22, border: "none", background: C.gold, color: C.ink, fontSize: 20, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>↑</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {["現在適合換美元嗎？","幫我試算換 100 萬","為什麼建議我等？"].map(q => (
            <button key={q} onClick={() => send(q)} style={{ background: C.bgDeep, border: `1px solid ${C.line}`, borderRadius: 16, padding: "8px 12px", color: C.textDim, fontSize: 11.5, cursor: "pointer" }}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
