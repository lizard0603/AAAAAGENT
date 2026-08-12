import { C } from "../styles/theme";
import { Icon, P } from "./icons";
import { fmt } from "../data/format";
import type { FxDatabase } from "../types/fx";

const mmdd = (iso: string) => iso.slice(5).replace("-", "/");

const CATEGORY_COLOR = [C.goldLt, C.gold, C.goldDeep, "#8a7550", "#5c5340"];

export function TripReportScreen({ db, go }: { db: FxDatabase; go: (s: string) => void }) {
  const r = db.pastTripReport;
  const days = Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000) + 1;
  const budgetTwd = days * r.dailyBudget;
  const diffTwd = r.totalSpentTwd - budgetTwd;
  const overBudget = diffTwd > 0;
  const maxCategory = Math.max(...r.categories.map(c => c.amountTwd));

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
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12.5 }}>
          <span style={{ color: C.textDim }}>對比預算 NT$ {fmt(budgetTwd)}</span>
          <span style={{
            fontWeight: 800, color: overBudget ? C.redSoft : "#8fd9ac",
            background: overBudget ? "rgba(217,112,95,.15)" : "rgba(143,217,172,.15)",
            borderRadius: 6, padding: "2px 8px",
          }}>{overBudget ? `超支 NT$ ${fmt(diffTwd)}` : `結餘 NT$ ${fmt(-diffTwd)}`}</span>
        </div>
      </div>

      {/* 卡片回饋 */}
      <div style={{ margin: "12px 18px 0", borderRadius: 14, padding: "12px 16px", background: C.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 21, borderRadius: 4, background: `linear-gradient(100deg,${C.goldDeep},${C.goldLt})`, flexShrink: 0 }} />
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

      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, textAlign: "center" }}>
          本報告由旅遊支出小助手於返國後自動彙整，實際消費請以信用卡帳單為準。
        </div>
      </div>

      <div style={{ height: 30 }} />
    </div>
  );
}
