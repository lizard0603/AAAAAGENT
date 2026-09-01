import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { SINOPAC_CURRENCIES } from "../data/currencies";
import type { CurrencyCode } from "../types/fx";

// ============================================================
//  幣別選擇彈窗（淺色底 bottom sheet）——換匯頁「換成」欄位、換匯守衛
//  「要換的幣別」共用同一顆元件，涵蓋永豐承作的全部幣別，可搜尋。
//  只在「淺色」畫面（ExchangeScreen／SetupScreen）用得到，所以直接用
//  固定的白底配色，不跟深色 theme 的 C 混用。
// ============================================================
export function CurrencyPicker({ title = "選擇幣別", value, onSelect, onClose }: {
  title?: string;
  value: CurrencyCode;
  onSelect: (ccy: CurrencyCode) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = SINOPAC_CURRENCIES.filter(c =>
    !query || c.ccyLabel.includes(q.trim()) || c.ccy.toLowerCase().includes(query) || (c.country ?? "").includes(q.trim())
  );

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />
      <div style={{
        position: "relative", background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        maxHeight: "80%", display: "flex", flexDirection: "column", padding: "18px 18px 8px", boxShadow: "0 -8px 30px rgba(0,0,0,.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.lightInk }}>{title}</span>
          <span onClick={onClose} style={{ cursor: "pointer", color: C.goldDeep, fontSize: 15, fontWeight: 700 }}>取消</span>
        </div>

        <div style={{
          marginTop: 14, flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
          border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "10px 14px", background: C.lightBg,
        }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋幣別"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: C.lightInk }} />
          <Icon d={P.search} size={16} color={C.lightDim} />
        </div>

        <div style={{ marginTop: 4, overflowY: "auto" }}>
          {filtered.map(c => {
            const active = c.ccy === value;
            return (
              <div key={c.ccy} onClick={() => { onSelect(c.ccy); onClose(); }} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 4px", cursor: "pointer",
                background: active ? "#fbf2df" : "transparent",
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 17, flexShrink: 0, background: C.lightBg,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>{c.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.lightInk }}>{c.ccyLabel}</div>
                  <div style={{ fontSize: 12, color: C.lightDim, marginTop: 1 }}>{c.ccy}</div>
                </div>
                {active && <Icon d={P.check} size={16} color={C.goldDeep} sw={2.4} />}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: "24px 4px", textAlign: "center", color: C.lightDim, fontSize: 13 }}>找不到符合的幣別</div>
          )}
        </div>
      </div>
    </div>
  );
}
