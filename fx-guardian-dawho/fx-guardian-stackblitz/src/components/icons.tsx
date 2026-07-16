// Simple inline SVG icons (original, minimal line icons)
export const Icon = ({ d, size = 24, color = "currentColor", fill = "none", sw = 1.8 }:
  { d: string; size?: number; color?: string; fill?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// iOS-style status bar glyphs (signal bars + battery shell)
export function SignalBars({ color = "currentColor" }: { color?: string }) {
  const bars = [4, 7, 10, 13];
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
      {bars.map((h, i) => (
        <rect key={i} x={i * 4.6} y={12 - h} width={3.2} height={h} rx={0.8} fill={color} />
      ))}
    </svg>
  );
}

export function BatteryGlyph({ color = "currentColor", level = 0.85 }: { color?: string; level?: number }) {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
      <rect x="0.75" y="0.75" width="20.5" height="10.5" rx="2.6" stroke={color} strokeOpacity={0.5} strokeWidth={1} />
      <rect x="2.4" y="2.4" width={17.2 * level} height="7.2" rx="1.4" fill={color} />
      <rect x="22.2" y="4" width="1.8" height="4" rx="0.9" fill={color} fillOpacity={0.5} />
    </svg>
  );
}

export const P = {
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  chart: "M3 3v18h18M7 15l4-5 3 3 5-7",
  star: "M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.9 9.1 9z",
  grid: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  headset: "M3 14v-3a9 9 0 0118 0v3M21 14a2 2 0 01-2 2h-1v-5h1a2 2 0 012 2zM3 14a2 2 0 002 2h1v-5H5a2 2 0 00-2 2z",
  qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM19 14h2v2M17 19h4v2",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z",
  chevR: "M9 6l6 6-6 6",
  swap: "M7 4v13M7 4L4 7M7 4l3 3M17 20V7M17 20l3-3M17 20l-3-3",
  clock: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  refresh: "M21 12a9 9 0 11-3-6.7M21 3v5h-5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  spark: "M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4",
  check: "M20 6L9 17l-5-5",
};
