import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import tierSeal from "../assets/tier-seal.png";
import type { FxDatabase, Opportunity } from "../types/fx";

const fmt = (n: number, d = 0) => n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });

const RATES = [
  { flag: "🇺🇸", name: "美元", ccy: "USD", rate: "32.2350", trend: [8,9,11,10,12,14,15,17,16,18,20,19] },
  { flag: "🇯🇵", name: "日圓", ccy: "JPY", rate: "0.2001", trend: [12,10,13,11,9,14,16,13,11,15,12,14] },
  { flag: "🇨🇳", name: "人民幣", ccy: "CNY", rate: "4.7712", trend: [7,8,9,8,10,11,13,12,14,16,15,18] },
];

function Spark({ data, alert }: { data: number[]; alert?: boolean }) {
  const w = 100, h = 44, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  const last = pts.split(" ").slice(-1)[0].split(",").map(Number);
  return (
    <svg width="100%" height="44" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={C.red} strokeWidth={1.6} />
      {alert && <circle cx={last[0]} cy={last[1]} r={4} fill={C.red} stroke="#fff" strokeWidth={1.2} />}
    </svg>
  );
}

export function HomeScreen({ db, opp, go, tripReportReady }: { db: FxDatabase; opp: Opportunity; go: (s: string) => void; tripReportReady?: boolean }) {
  const twd = db.accounts.find(a => a.ccy === "TWD")?.balance ?? 0;
  const configured = db.fxWatch.length > 0;
  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg }}>
      {/* marble header */}
      <div style={{
        background: `linear-gradient(135deg,${C.marble1} 0%,${C.marble2} 55%,#d8d3c8 100%)`,
        borderRadius: "0 0 26px 26px", padding: "10px 22px 26px", position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6 }}>
          <Icon d={P.qr} size={26} color={C.ink} />
          <div style={{ display: "flex", gap: 18 }}>
            <Icon d={P.bell} size={23} color={C.ink} />
            <Icon d={P.headset} size={23} color={C.ink} />
            {/* 旅遊代理人快速入口——跟下面的「偵測到您有旅遊消費紀錄」pill 同一個目的地 */}
            <span onClick={() => go("travelAgent")} style={{ cursor: "pointer", display: "flex" }}>
              <Icon d={P.plane} size={23} color={C.ink} fill={C.ink} sw={0} />
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 26, marginTop: 20, fontSize: 20, color: "#9b9186", fontWeight: 500 }}>
          <span>投資</span>
          <span style={{ color: C.goldDeep, fontWeight: 800, fontSize: 24 }}>存款</span>
          <span onClick={() => go("card")} style={{ cursor: "pointer" }}>信用卡</span>
          <span>證券</span>
          <span>貸款</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.ink, fontSize: 19, fontWeight: 700 }}>
            臺幣存款 <Icon d={P.eye} size={18} color={C.ink} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 }}>
            <span style={{ color: C.goldDeep, fontSize: 17, fontWeight: 700 }}>ⓘ TWD</span>
            <span style={{ color: C.goldDeep, fontSize: 40, fontWeight: 800, letterSpacing: .5 }}>{fmt(twd)}</span>
            <Icon d={P.chevR} size={22} color={C.goldDeep} />
          </div>
          <div style={{ marginTop: 6, color: "#6b6459", fontSize: 16, fontWeight: 600 }}>
            外幣存款 TWD 546 ›
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 16 }}>
            {[0,1,2,3,4].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: i === 1 ? C.goldDeep : "#c3bcae" }} />)}
          </div>
        </div>
      </div>

      {/* promo pill — 平常是旅遊代理人觸發入口；Demo 控制台模擬「旅遊已結束」情境時，
          換成「收支報告已完成」的文案與圖示，點進去才是完整的 TripReportScreen。 */}
      <div onClick={() => go(tripReportReady ? "tripReport" : "travelAgent")} style={{ margin: "18px 18px 0", border: `1px solid ${C.gold}`, borderRadius: 30, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <span style={{ color: C.text, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={tripReportReady ? P.chart : P.plane} size={16} color={C.gold} fill={tripReportReady ? "none" : C.gold} sw={tripReportReady ? 1.8 : 0} />
          {tripReportReady ? "旅程結束，您的收支報告已經準備好了" : "偵測到您有旅遊消費紀錄，設定旅遊小助手"}
        </span>
        <span style={{ color: C.gold, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {tripReportReady ? "立即查看" : "立即設定"} <span style={{ background: C.gold, color: C.ink, borderRadius: 10, width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>›</span>
        </span>
      </div>

      {/* tier gold card */}
      <div style={{ margin: "16px 18px 0", borderRadius: 16, overflow: "hidden", background: C.card }}>
        <div style={{ background: `linear-gradient(100deg,${C.goldDeep},${C.goldLt} 60%,${C.gold})`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <img src={tierSeal} alt="" style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} />
          <span style={{ color: C.ink, fontSize: 18, fontWeight: 800 }}>7 月等級優惠</span>
          <span style={{ color: C.ink, opacity: .7 }}>ⓘ</span>
        </div>
        <div style={{ display: "flex", padding: "16px 8px" }}>
          {[["活儲年利率", "最高 1.5", "%"], ["臺幣累計利息", "186", "元"], ["免費跨提轉", "剩 21", "次"]].map(([a, b, c], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ color: C.textDim, fontSize: 13 }}>{a}</div>
              <div style={{ color: C.goldLt, fontSize: 20, fontWeight: 800, marginTop: 6 }}>{b}<span style={{ fontSize: 13 }}> {c}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* rate / interest toggle */}
      <div style={{ margin: "18px 18px 0", borderRadius: 16, background: C.card, padding: "16px 0 10px" }}>
        <div style={{ display: "flex", padding: "0 20px", gap: 30 }}>
          <span style={{ color: C.goldLt, fontSize: 18, fontWeight: 800, borderBottom: `2px solid ${C.goldLt}`, paddingBottom: 8 }}>匯率</span>
          <span style={{ color: C.textDim, fontSize: 18, fontWeight: 600 }}>利率</span>
        </div>
        <div style={{ height: 1, background: C.line, margin: "0 0 14px" }} />

        {/* rate discount banner */}
        <div style={{
          margin: "0 18px 14px", borderRadius: 12, padding: "12px 16px",
          background: `linear-gradient(100deg,${C.bgDeep},#241d10 70%)`,
          border: `1px solid ${C.goldDeep}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: C.goldLt, fontSize: 14, fontWeight: 700 }}>
            <Icon d={P.clock} size={16} color={C.goldLt} />
            DAWHO換匯減分超優惠
          </span>
          <span style={{ color: C.gold, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
            查看優惠 <Icon d={P.chevR} size={14} color={C.gold} />
          </span>
        </div>

        {/* FX Guardian monitoring entry (agent woven into rate section) */}
        <button onClick={() => go("agent")} style={{
          width: "calc(100% - 36px)", margin: "0 18px 14px", border: "none", cursor: "pointer",
          background: opp.state !== "none" ? "linear-gradient(100deg,#3a3320,#463a1e)" : `linear-gradient(100deg,${C.goldDeep},${C.gold})`,
          borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "relative", boxShadow: opp.state === "advise" ? "0 0 0 1.5px rgba(74,222,128,.5)" : "none",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: opp.state !== "none" ? C.goldLt : C.ink, fontSize: 15, fontWeight: 800 }}>
            <Icon d={P.shield} size={18} color={opp.state !== "none" ? C.goldLt : C.ink} />
            {!configured ? "尚未設定 · 點我設定換匯守衛" : opp.state === "advise" ? "換匯守衛：偵測到甜蜜點！" : "DAWHO 換匯守衛 · 監控中"}
            {opp.state !== "none" && <span style={{ width: 8, height: 8, borderRadius: 4, background: C.green, animation: "pulse 1.6s infinite" }} />}
          </span>
          <span style={{ color: opp.state !== "none" ? C.goldLt : C.ink, fontSize: 14, fontWeight: 700 }}>{configured ? "查看 ›" : "設定 ›"}</span>
        </button>

        {/* rate cards */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 18px 6px" }}>
          {RATES.map((r, i) => (
            <div key={r.ccy} style={{ minWidth: 150, background: C.bgDeep, borderRadius: 14, padding: "14px 14px 12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <span style={{ fontSize: 20 }}>{r.flag}</span>
                <span style={{ color: C.text, fontSize: 17, fontWeight: 700 }}>{r.name}</span>
              </div>
              <div style={{ textAlign: "center", color: C.goldLt, fontSize: 22, fontWeight: 800, margin: "10px 0 8px" }}>{r.rate}</div>
              <Spark data={r.trend} alert={i === 0 && opp.state !== "none"} />
              <button onClick={() => go("exchange")} style={{
                width: "100%", marginTop: 10, border: "none", cursor: "pointer",
                background: `linear-gradient(100deg,${C.goldDeep},${C.gold})`, color: C.ink,
                borderRadius: 20, padding: "9px 0", fontSize: 15, fontWeight: 800,
              }}>立即換匯</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textDim, fontSize: 13, padding: "12px 20px 0" }}>
          <Icon d={P.refresh} size={15} color={C.textDim} /> 更新時間 2026/07/15 10:14:42
        </div>
        <div onClick={() => go("trend")} style={{ textAlign: "center", color: C.goldLt, fontSize: 16, fontWeight: 700, padding: "14px 0 6px", cursor: "pointer" }}>查看更多</div>
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
