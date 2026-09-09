import { C } from "../styles/theme";
import { Icon, P } from "./icons";

// ============================================================
//  結匯性質選擇彈窗（淺色底 bottom sheet）——比照永豐實際換匯頁的
//  「常用申報性質」／「申報細項」清單彈窗，純列表、不用搜尋。
//  跟 CurrencyPicker 同一種 bottom sheet 模式，只是內容換成申報代碼清單。
// ============================================================
export function PurposePicker({ title, options, value, onSelect, onClose }: {
  title: string;
  options: string[];
  value: string;
  onSelect: (purpose: string) => void;
  onClose: () => void;
}) {
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

        <div style={{ marginTop: 8, overflowY: "auto" }}>
          {options.map(opt => {
            const active = opt === value;
            return (
              <div key={opt} onClick={() => { onSelect(opt); onClose(); }} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "16px 4px", cursor: "pointer", borderBottom: `1px solid ${C.lightLine}`,
                background: active ? "#fbf2df" : "transparent",
              }}>
                <span style={{ fontSize: 14, color: C.lightInk, lineHeight: 1.5 }}>{opt}</span>
                {active && <Icon d={P.check} size={16} color={C.goldDeep} sw={2.4} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
