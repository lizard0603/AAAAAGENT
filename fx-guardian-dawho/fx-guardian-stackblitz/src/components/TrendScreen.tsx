import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import type { FxDatabase, Opportunity } from "../types/fx";

const fmt = (n: number, d = 0) => n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

// 30-day USD sell trend (gold line, like the mockup)
const TREND = [31.61,31.63,31.64,31.67,31.67,31.67,31.68,31.72,31.72,31.85,31.91,31.97,31.97,31.97,31.93,31.9,31.95,32.01,32.03,32.04,32.05,32.11,32.24,32.19,32.27,32.28,32.28,32.29,32.31,32.28];
const LABELS = ["06/15","06/20","06/25","06/30","07/05","07/10"];

function TrendChart({ opp }: { opp: Opportunity }) {
  const w = 340, h = 190, pad = 8;
  const max = 32.4, min = 31.6;
  const x = (i: number) => pad + (i / (TREND.length - 1)) * (w - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
  const pts = TREND.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const lastX = x(TREND.length - 1), lastY = y(TREND[TREND.length - 1]);
  // sweet spot marker = the recent local dip the agent flagged
  const dipI = 15; const dipX = x(dipI), dipY = y(TREND[dipI]);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 24}`} style={{ display: "block" }}>
      {[32.4,32.2,32.0,31.8,31.6].map((g) => (
        <g key={g}>
          <line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke={C.lightLine} strokeWidth={1} />
          <text x={pad} y={y(g) - 4} fontSize="10" fill={C.lightDim}>{g.toFixed(1)}</text>
        </g>
      ))}
      <polyline points={pts} fill="none" stroke={C.gold} strokeWidth={2} />
      {TREND.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={C.gold} />)}
      {/* agent sweet-spot annotation */}
      {opp.state !== "none" && (
        <g>
          <circle cx={dipX} cy={dipY} r={7} fill="none" stroke={C.green} strokeWidth={2} />
          <line x1={dipX} y1={dipY - 10} x2={dipX} y2={dipY - 30} stroke={C.green} strokeWidth={1.4} strokeDasharray="3 2" />
          <rect x={dipX - 34} y={dipY - 48} width={68} height={18} rx={5} fill={C.green} />
          <text x={dipX} y={dipY - 35} fontSize="10" fontWeight="700" fill="#053" textAnchor="middle">AI 甜蜜點</text>
        </g>
      )}
      <circle cx={lastX} cy={lastY} r={4} fill={C.gold} stroke="#fff" strokeWidth={1.5} />
      {LABELS.map((l, i) => (
        <text key={l} x={pad + (i / (LABELS.length - 1)) * (w - pad * 2)} y={h + 16} fontSize="10" fill={C.lightDim} textAnchor="middle">{l}</text>
      ))}
    </svg>
  );
}

export function TrendScreen({ db, opp, go }: { db: FxDatabase; opp: Opportunity; go: (s: string) => void }) {
  const order = db.fxWatch[0];
  const usd = db.fxRates.USD;
  const [noticeOpen, setNoticeOpen] = useState(true);
  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.lightBg }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", position: "relative" }}>
        <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 21, fontWeight: 800, color: C.lightInk }}>匯率走勢</span>
        <span style={{ width: 26 }} />
      </div>

      <div style={{ display: "flex", padding: "0 24px", gap: 40, marginTop: 4 }}>
        <span style={{ color: C.goldDeep, fontSize: 19, fontWeight: 800, borderBottom: `2px solid ${C.goldDeep}`, paddingBottom: 10 }}>我要買外幣</span>
        <span style={{ color: C.lightDim, fontSize: 19, fontWeight: 600 }}>我要賣外幣</span>
      </div>
      <div style={{ height: 1, background: C.lightLine }} />

      {/* convert form */}
      <div style={{ margin: "18px 18px 0", background: C.lightCard, borderRadius: 16, padding: "18px 18px 20px", boxShadow: "0 4px 16px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.lightInk, marginBottom: 12 }}>我要用</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🇹🇼</span><span style={{ color: C.lightDim, fontSize: 16 }}>新臺幣</span>
          </div>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "12px 14px", color: C.lightDim, fontSize: 16, textAlign: "right" }}>請輸入金額</div>
        </div>
        <div style={{ textAlign: "center", margin: "12px 0" }}>
          <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: 20, background: C.goldDeep, color: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Icon d={P.swap} size={20} color="#fff" />
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.lightInk }}>換成</span>
          <span style={{ fontSize: 14, color: C.lightDim }}>牌告匯率 <b style={{ color: C.lightInk }}>{usd.spot.toFixed(5)}</b></span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, border: `1px solid ${C.lightLine}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🇺🇸</span><span style={{ color: C.lightInk, fontSize: 16, fontWeight: 600 }}>美元 ▾</span>
          </div>
          <div style={{ flex: 1, background: "#f0ede7", borderRadius: 10, padding: "12px 14px", color: C.lightDim, fontSize: 16, textAlign: "right" }}>0</div>
        </div>
      </div>

      {/* agent banner */}
      {opp.state !== "none" && (
        <div onClick={() => go("agent")} style={{ margin: "14px 18px 0", background: "linear-gradient(100deg,#eafaf0,#dff5e8)", border: `1px solid ${C.green}`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <Icon d={P.shield} size={20} color="#22A85A" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1a7a45" }}>換匯守衛：美元已達您的門檻 {order.targetRate}</div>
            <div style={{ fontSize: 12, color: "#3a8a5f", marginTop: 2 }}>目前 {usd.bank_sell}，仍在區間內 · 點我看建議</div>
          </div>
          <span style={{ color: "#22A85A", fontSize: 18 }}>›</span>
        </div>
      )}

      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: C.lightInk }}>匯率走勢圖</span>
        <span style={{ fontSize: 12, color: C.lightDim }}>資料時間 2026/07/15 10:14</span>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "12px 20px 0" }}>
        {["今天","近30天","近3月","近6月"].map((t, i) => (
          <span key={t} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: i === 1 ? C.goldDeep : "#eceae4", color: i === 1 ? "#fff" : C.lightDim }}>{t}</span>
        ))}
      </div>
      <div style={{ padding: "10px 14px 0" }}><TrendChart opp={opp} /></div>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 13, color: C.lightDim, padding: "4px 0 0" }}>
        <span>— 賣匯</span><span>-- 我的平均成本 ⓘ</span>
      </div>

      {/* no-history nudge */}
      {db.history.length === 0 && (
        <div style={{ margin: "16px 18px 0", background: "#FBF2E4", borderRadius: 12, padding: "13px 16px", textAlign: "center", color: "#8A6A2E", fontSize: 14, fontWeight: 600 }}>
          登楞還沒換匯過！快開啟第一筆換匯吧~
        </div>
      )}

      {/* CTA row */}
      <div style={{ display: "flex", gap: 12, padding: "18px 18px 0" }}>
        <button style={{ flex: 1, border: `1px solid ${C.goldDeep}`, background: "transparent", color: C.goldDeep, borderRadius: 12, padding: "16px 0", fontSize: 17, fontWeight: 800, cursor: "pointer" }}>換匯優利定存</button>
        <button onClick={() => go("exchange")} style={{ flex: 1, border: "none", background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink, borderRadius: 12, padding: "16px 0", fontSize: 17, fontWeight: 800, cursor: "pointer" }}>立即買外幣</button>
      </div>

      {/* notice */}
      <div style={{ margin: "22px 18px 0" }}>
        <div onClick={() => setNoticeOpen(!noticeOpen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.lightInk }}>注意事項</span>
          <span style={{ color: C.lightDim, fontSize: 18 }}>{noticeOpen ? "—" : "+"}</span>
        </div>
        {noticeOpen && (
          <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "#6a6a70", fontSize: 12.5, lineHeight: 1.7 }}>
            <li>本頁資訊僅供參考，實際成交匯率以本行牌告交易當下所議定的匯率為準（牌告匯率報價時間更新自9:00至15:30止），歷史牌告資訊為本行每營業日牌告匯率15:30的收盤價格，實際成交匯率以當下議定之匯率為準。</li>
            <li>本項紀錄不可作為「銀行帳戶餘額」或往來憑證之文件。</li>
            <li>本項資訊僅提供結購(臺幣換外幣)與結售(外幣換臺幣)之試算服務。</li>
          </ul>
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}
