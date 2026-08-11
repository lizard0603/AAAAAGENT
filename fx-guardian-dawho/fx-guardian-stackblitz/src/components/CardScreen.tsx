import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt } from "../data/format";
import type { FxDatabase } from "../types/fx";

const mmdd = (iso: string) => iso.slice(5).replace("-", "/");

const TABS = ["未出帳明細", "帳務資訊", "專屬優惠"];
const QUICK_ACTIONS = [
  { label: "單筆分期", icon: P.clock },
  { label: "卡友好貸", icon: P.swap },
  { label: "Apple Pay綁定", icon: P.card },
];

// 未出帳金額 / 可用額度只是這頁的展示用數字，跟旅遊代理人的偵測邏輯無關，
// 所以沒有另外放進 mockDb——真的要接資料時再補到 FxDatabase 裡。
const UNBILLED_AMOUNT = 37238;
const AVAILABLE_CREDIT = 161614;

export function CardScreen({ db, go }: { db: FxDatabase; go: (s: string) => void }) {
  const [tab, setTab] = useState(0);
  const transactions = db.cardTransactions.slice(0, 5);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg }}>
      {/* marble header — 沿用 HomeScreen 的淺色大理石卡頭風格 */}
      <div style={{
        background: `linear-gradient(135deg,${C.marble1} 0%,${C.marble2} 55%,#d8d3c8 100%)`,
        borderRadius: "0 0 26px 26px", padding: "14px 18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.goldDeep, fontSize: 26 }}>‹</span>
          <span style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: C.ink, marginRight: 26 }}>信用卡</span>
        </div>

        <div style={{ display: "flex", gap: 22, marginTop: 18, fontSize: 15 }}>
          {TABS.map((t, i) => (
            <span key={t} style={{
              color: i === tab ? C.goldDeep : "#9b9186", fontWeight: i === tab ? 800 : 600,
              borderBottom: i === tab ? `2px solid ${C.goldDeep}` : "none", paddingBottom: 8,
              cursor: i === 0 ? "pointer" : "default",
            }} onClick={() => i === 0 && setTab(i)}>{t}</span>
          ))}
        </div>
        <div style={{ height: 1, background: "rgba(0,0,0,.08)", margin: "0 0 16px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#8a8378", fontWeight: 600 }}>TWD臺幣</span>
          <Icon d={P.chevR} size={14} color="#8a8378" />
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={{ color: C.goldDeep, fontSize: 15, fontWeight: 700 }}>TWD </span>
          <span style={{ color: C.goldDeep, fontSize: 13, fontWeight: 700 }}>未出帳金額</span>
          <div style={{ color: C.goldDeep, fontSize: 40, fontWeight: 800, letterSpacing: .5 }}>{fmt(UNBILLED_AMOUNT)}</div>
        </div>
        <div style={{ color: "#6b6459", fontSize: 14, marginTop: 4 }}>可用額度 {fmt(AVAILABLE_CREDIT)}</div>

        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 22 }}>
          {QUICK_ACTIONS.map(a => (
            <div key={a.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={a.icon} size={20} color={C.goldLt} />
              </div>
              <span style={{ fontSize: 12, color: "#4a463f", fontWeight: 600 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* dark body — 沿用 HomeScreen 卡片區塊的深色風格 */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontSize: 17, fontWeight: 800 }}>
            最新消費記錄 <span style={{ color: C.textDim, fontSize: 14, fontWeight: 400 }}>ⓘ</span>
          </div>
          <span style={{ color: C.textDim, fontSize: 12.5 }}>依臺幣計</span>
        </div>

        <div style={{ background: C.card, borderRadius: 14, overflow: "hidden" }}>
          {transactions.map((tx, i) => (
            <div key={`${tx.date}-${tx.merchant}`} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderBottom: i < transactions.length - 1 ? `1px solid ${C.line}` : "none",
            }}>
              <span style={{ color: C.textDim, fontSize: 13, width: 42, flexShrink: 0 }}>{mmdd(tx.date)}</span>
              <span style={{ flex: 1, color: C.text, fontSize: 14, fontWeight: 600 }}>{tx.merchant}</span>
              <span style={{ color: C.goldLt, fontSize: 15, fontWeight: 700 }}>{fmt(tx.amountTwd)}</span>
              <Icon d={P.chevR} size={14} color={C.textDim} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", color: C.goldLt, fontSize: 14, fontWeight: 700, padding: "14px 0" }}>更多 +</div>
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
