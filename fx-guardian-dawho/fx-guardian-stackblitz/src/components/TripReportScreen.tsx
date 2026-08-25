import { useState } from "react";
import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt } from "../data/format";
import cardArt from "../assets/sinopac-card.png";
import type { FxDatabase } from "../types/fx";

const mmdd = (iso: string) => iso.slice(5).replace("-", "/");
const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const CATEGORY_COLOR = [C.goldLt, C.gold, C.goldDeep, "#8a7550", "#5c5340"];

// 旅程消費軌跡的小折線圖——純回顧用途，刻意不標示「哪天花最多」，
// 只畫出金色的消費節奏線，沿用 HomeScreen Spark 的畫法但改成含底色的面積圖。
function SpendTrendChart({ data }: { data: number[] }) {
  const w = 300, h = 74, pad = 6;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h} ${line} ${w - pad},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polygon points={area} fill="rgba(201,161,90,.14)" />
      <polyline points={line} fill="none" stroke={C.goldLt} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={C.goldLt} />)}
    </svg>
  );
}

export function TripReportScreen({ db, go }: { db: FxDatabase; go: (s: string) => void }) {
  const r = db.pastTripReport;
  const days = Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000) + 1;
  const maxCategory = Math.max(...r.categories.map(c => c.amountTwd));
  // 以下三個都是示意用的按鈕狀態，點了只會顯示確認文字，沒有真的送出任何委託或提醒。
  const [remainingChoice, setRemainingChoice] = useState<"deposit" | "keep" | null>(null);
  const [rateWatchArmed, setRateWatchArmed] = useState(false);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
        <span onClick={() => go("home")} style={{ cursor: "pointer", color: C.gold, fontSize: 26 }}>‹</span>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={P.chart} size={19} color={C.goldLt} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>旅遊收支報告</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>
            {r.flag} {r.destinationLabel} · {mmdd(r.startDate)}–{mmdd(r.endDate)}（{days} 天）
          </div>
        </div>
      </div>

      {/* 總支出 hero */}
      <div style={{ margin: "18px 18px 0", borderRadius: 16, padding: "18px 16px", background: `linear-gradient(135deg,${C.bgDeep},#241d10)`, border: `1px solid ${C.goldDeep}` }}>
        <div style={{ fontSize: 12.5, color: C.textDim }}>旅程總支出</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: C.goldLt }}>NT$ {fmt(r.totalSpentTwd)}</span>
          <span style={{ fontSize: 13, color: C.textDim }}>约 {r.ccyLabel} {fmt(r.totalSpentForeign)}</span>
        </div>
      </div>

      {/* 卡片回饋 */}
      <div style={{ margin: "12px 18px 0", borderRadius: 14, padding: "12px 16px", background: C.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={cardArt} alt="" style={{ width: 32, height: 20.3, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>永豐幣倍卡 海外刷卡回饋</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.goldLt }}>+NT$ {fmt(r.cashbackTwd)}</span>
      </div>

      {/* 類別拆分 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>消費類別拆分</div>
        <div style={{ background: C.card, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {r.categories.map((c, i) => {
            const pct = r.totalSpentTwd ? Math.round((c.amountTwd / r.totalSpentTwd) * 100) : 0;
            return (
              <div key={c.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{c.label}</span>
                  <span style={{ color: C.textDim }}>NT$ {fmt(c.amountTwd)} · {pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.bgDeep, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${maxCategory ? (c.amountTwd / maxCategory) * 100 : 0}%`,
                    background: CATEGORY_COLOR[i % CATEGORY_COLOR.length], borderRadius: 3,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 消費排行 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>消費排行 Top {r.topMerchants.length}</div>
        <div style={{ background: C.card, borderRadius: 14, overflow: "hidden" }}>
          {r.topMerchants.map((m, i) => (
            <div key={m.merchant} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
              borderBottom: i < r.topMerchants.length - 1 ? `1px solid ${C.line}` : "none",
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(201,161,90,.15)", color: C.goldLt, fontSize: 12, fontWeight: 800,
              }}>{i + 1}</span>
              <span style={{ flex: 1, color: C.text, fontSize: 14, fontWeight: 600 }}>{m.merchant}</span>
              <span style={{ color: C.goldLt, fontSize: 14, fontWeight: 700 }}>NT$ {fmt(m.amountTwd)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 一、剩餘外幣運用建議 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>剩餘外幣運用建議</div>
        <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px" }}>
          <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>旅程結束後，您還有</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.goldLt, marginTop: 4 }}>
            {r.ccyLabel} {fmt(r.remainingForeignAmount)}
          </div>
          <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 8, lineHeight: 1.6 }}>
            幫這筆外幣找個更划算的去處，讓下一次出發更輕鬆。
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => setRemainingChoice("deposit")} style={{
              flex: 1, border: `1px solid ${remainingChoice === "deposit" ? C.goldDeep : C.line}`, borderRadius: 10, padding: "10px 8px",
              background: remainingChoice === "deposit" ? "rgba(201,161,90,.18)" : "transparent", cursor: "pointer",
              color: remainingChoice === "deposit" ? C.goldLt : C.textDim, fontSize: 12.5, fontWeight: 700,
            }}>轉入外幣優利定存</button>
            <button onClick={() => setRemainingChoice("keep")} style={{
              flex: 1, border: `1px solid ${remainingChoice === "keep" ? C.goldDeep : C.line}`, borderRadius: 10, padding: "10px 8px",
              background: remainingChoice === "keep" ? "rgba(201,161,90,.18)" : "transparent", cursor: "pointer",
              color: remainingChoice === "keep" ? C.goldLt : C.textDim, fontSize: 12.5, fontWeight: 700,
            }}>保留至下趟旅程</button>
          </div>
          {remainingChoice && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#8fd9ac", lineHeight: 1.5 }}>
              {remainingChoice === "deposit"
                ? `✓ 已為您安排將 ${r.ccyLabel} ${fmt(r.remainingForeignAmount)} 轉入外幣優利定存，行員將盡快與您聯繫。`
                : `✓ 已為您保留這筆 ${r.ccyLabel}，下次到${r.destinationLabel}直接帶著出發。`}
            </div>
          )}
        </div>
      </div>

      {/* 二、換匯成本回顧 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>換匯成本回顧</div>
        <div style={{
          background: `linear-gradient(135deg,${C.bgDeep},#241d10)`, border: `1px solid ${C.goldDeep}`, borderRadius: 14,
          padding: "16px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon d={P.shield} size={20} color={C.goldLt} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>這趟透過換匯守衛換匯，較一般即期匯率</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.goldLt, marginTop: 2 }}>為您多換得約 NT$ {fmt(r.fxSavingsTwd)}</div>
          </div>
        </div>
      </div>

      {/* 三、下趟旅程預測與預先準備 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>下趟旅程預測</div>
        <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(201,161,90,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon d={P.plane} size={15} color={C.goldLt} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>
              您常在這個季節出國，依過往習慣，旅遊小助手預估您下趟旅程大約在
              <span style={{ color: C.goldLt, fontWeight: 800 }}> {r.predictedNextTripMonth} 月</span>。
            </div>
            <button onClick={() => setRateWatchArmed(true)} disabled={rateWatchArmed} style={{
              marginTop: 12, width: "100%", border: `1px solid ${C.goldDeep}`, background: "transparent",
              color: rateWatchArmed ? "#8fd9ac" : C.goldLt, borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700,
              cursor: rateWatchArmed ? "default" : "pointer",
            }}>{rateWatchArmed ? "✓ 已為您排入提前留意" : "提前幫我留意匯率甜蜜點"}</button>
          </div>
        </div>
      </div>

      {/* 四、每日消費趨勢 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>旅程消費軌跡</div>
        <div style={{ background: C.card, borderRadius: 14, padding: "16px 16px 12px" }}>
          <SpendTrendChart data={r.dailySpendTwd} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {r.dailySpendTwd.map((_, i) => (
              <span key={i} style={{ fontSize: 10.5, color: C.textDim }}>{mmdd(addDays(r.startDate, i))}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 12, lineHeight: 1.6, textAlign: "center" }}>
            這趟旅程每一天的節奏，都由旅遊小助手完整記錄下來。
          </div>
        </div>
      </div>

      {/* 五、回饋最大化亮點 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>回饋最大化亮點</div>
        <div style={{
          background: `linear-gradient(135deg,${C.bgDeep},#241d10)`, border: `1px solid ${C.goldDeep}`, borderRadius: 16,
          padding: "22px 18px", textAlign: "center",
        }}>
          <img src={cardArt} alt="" style={{ width: 52, height: 33, borderRadius: 6, objectFit: "cover", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>這趟用永豐幣倍卡海外刷卡，</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.goldLt, marginTop: 4 }}>為您賺回 NT$ {fmt(r.cashbackTwd)}</div>
          <div style={{
            marginTop: 10, display: "inline-block", background: "rgba(201,161,90,.18)", borderRadius: 20,
            padding: "6px 14px", fontSize: 12.5, color: C.goldLt, fontWeight: 700,
          }}>約等於{r.cashbackEquivalent}</div>
        </div>
      </div>

      {/* 六、消費商家清單 */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>旅程消費回憶</div>
        <div style={{ background: C.card, borderRadius: 14, overflow: "hidden" }}>
          {r.allMerchants.map((m, i) => (
            <div key={m.merchant} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderBottom: i < r.allMerchants.length - 1 ? `1px solid ${C.line}` : "none",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: C.gold, flexShrink: 0 }} />
              <span style={{ flex: 1, color: C.text, fontSize: 13.5, fontWeight: 600 }}>{m.merchant}</span>
              <span style={{ color: C.goldLt, fontSize: 13.5, fontWeight: 700 }}>NT$ {fmt(m.amountTwd)}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 10, textAlign: "center", lineHeight: 1.6 }}>
          這些都是這趟旅程留下的足跡，方便您隨時回顧與對帳。
        </div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, textAlign: "center" }}>
          本報告由旅遊小助手於返國後自動彙整，實際消費請以信用卡帳單為準。
        </div>
      </div>

      <div style={{ height: 30 }} />
    </div>
  );
}
