import { styles as S } from "../styles/theme";

export function StatusBar() {
  return (
    <div style={S.statusBar}>
      <span>9:41</span>
      <span style={{ letterSpacing: 1 }}>SinoPac · DAWHO</span>
      <span>▉▉▉ 100%</span>
    </div>
  );
}

export function Bubble({ role, text, typing }: { role: "agent" | "user"; text: string; typing?: boolean }) {
  const isAgent = role === "agent";
  return (
    <div style={{ ...S.bubbleRow, justifyContent: isAgent ? "flex-start" : "flex-end" }}>
      {isAgent && <div style={S.bubbleIcon}>◈</div>}
      <div style={{ ...S.bubble, ...(isAgent ? S.bubbleAgent : S.bubbleUser) }}>
        {typing ? <span style={S.typing}>正在分析匯率…</span> : text}
      </div>
    </div>
  );
}

const TABS = [
  { id: "home", label: "首頁", icon: "⌂" },
  { id: "assets", label: "資產", icon: "◵" },
  { id: "agent", label: "代理人", icon: "◈" },
  { id: "cards", label: "卡片", icon: "▭" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function TabBar({
  tab,
  setTab,
  alert,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  alert: boolean;
}) {
  return (
    <div style={S.tabBar}>
      {TABS.map((t) => (
        <button
          key={t.id}
          style={{ ...S.tabItem, color: tab === t.id ? "#E8C97A" : "#7A8290" }}
          onClick={() => setTab(t.id)}
        >
          <span style={{ fontSize: 20, position: "relative" }}>
            {t.icon}
            {t.id === "agent" && alert && <span style={S.tabAlertDot} />}
          </span>
          <span style={S.tabLabel}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div style={{ ...S.screen, ...S.placeholder }}>
      <div style={S.placeholderIcon}>◷</div>
      <div style={S.placeholderTitle}>{title}</div>
      <div style={S.placeholderSub}>此分頁為原型佔位，POC 聚焦「換匯守衛」代理人。</div>
    </div>
  );
}
