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

// ATM 提款圖示（插卡口＋手拿著鈔票／硬幣）——使用者提供的參考圖，用 potrace 向量化
// 而來，細節比其他手繪 icon 多，所以沒有塞進 P／Icon 那套「單一 24x24 path」系統，
// 獨立成一個小元件（跟 SignalBars／BatteryGlyph 一樣的模式），保留原始 viewBox
// 才不用手動換算座標。size／color 用法跟 Icon 一致，方便照 theme 換色。
export function WithdrawIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 183.610851 164.175302">
      <g transform="translate(-8.60456,164.238754) scale(0.1,-0.1)" fill={color} stroke="none">
        <path d="M101 1621 c-21 -21 -20 -322 1 -348 8 -10 56 -13 179 -13 l169 0 0 -314 c0 -382 -27 -340 227 -344 182 -3 193 -4 193 -22 0 -35 22 -69 56 -85 27 -13 34 -22 34 -45 0 -66 35 -85 163 -88 l114 -4 6 -106 c7 -138 40 -245 76 -250 20 -3 23 -1 16 15 -52 128 -70 242 -25 153 26 -50 87 -120 106 -120 24 0 16 25 -21 66 -70 78 -91 150 -105 364 -8 128 -14 162 -55 294 -53 175 -53 170 -16 207 73 73 131 27 186 -146 60 -187 118 -305 151 -305 17 0 19 31 3 47 -9 9 2 18 43 36 97 43 80 76 -18 38 -70 -26 -68 -27 -48 11 15 29 16 56 11 215 -4 107 -3 183 2 183 13 0 217 -229 261 -292 l35 -50 -1 -121 c-1 -67 -2 -214 -4 -327 -4 -217 2 -263 36 -268 20 -3 20 -1 7 75 -14 77 -14 118 3 468 10 197 2 212 -234 470 l-101 110 -1 68 0 67 173 0 c121 0 177 4 185 12 23 23 16 345 -7 358 -41 21 -1778 13 -1800 -9z m1779 -171 l0 -150 -165 0 -164 0 -7 35 c-11 60 -4 65 85 65 88 0 108 13 95 64 -9 36 1 36 -727 36 -720 0 -717 0 -717 -48 0 -43 17 -52 97 -52 l73 0 0 -50 0 -50 -159 0 c-136 0 -160 2 -165 16 -8 21 -8 269 1 277 3 4 399 7 880 7 l873 0 0 -150z m-1308 -352 l3 -363 313 -3 313 -2 15 -35 c8 -19 14 -39 14 -45 0 -7 -117 -9 -367 -8 l-368 3 -3 395 c-3 444 -5 420 43 420 l35 0 2 -362z m152 354 c17 -28 -77 -124 -104 -107 -11 7 -14 98 -3 108 9 10 101 9 107 -1z m536 -41 c0 -102 37 -118 42 -18 l3 62 40 0 40 0 3 -222 c1 -123 1 -223 -1 -223 -1 0 -20 9 -42 20 -124 63 -216 -26 -176 -171 12 -42 21 -79 21 -83 0 -3 -94 -6 -209 -6 l-208 0 -7 30 c-8 43 -74 110 -116 119 l-35 7 -3 185 -2 186 39 12 c51 15 97 61 112 112 l12 39 244 0 243 0 0 -49z m240 -333 c0 -210 -2 -379 -5 -376 -3 3 -19 45 -35 93 l-30 89 0 288 0 288 35 0 35 0 0 -382z m-824 -214 c24 -16 54 -62 54 -84 0 -6 -25 -10 -60 -10 l-60 0 0 55 c0 62 16 71 66 39z m572 -301 l3 -33 -160 0 c-148 0 -161 1 -171 19 -26 50 -23 52 158 49 l167 -3 3 -32z m-3 -118 l0 -40 -104 -3 c-113 -3 -141 8 -141 54 0 31 10 33 135 31 l110 -2 0 -40z M941 1369 c-82 -33 -125 -101 -119 -190 15 -213 325 -227 364 -16 23 132 -122 255 -245 206z m144 -53 c81 -53 76 -195 -8 -246 -150 -92 -296 117 -165 237 40 36 124 41 173 9z" />
      </g>
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
  chevDown: "M6 9l6 6 6-6",
  swap: "M7 4v13M7 4L4 7M7 4l3 3M17 20V7M17 20l3-3M17 20l-3-3",
  clock: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  refresh: "M21 12a9 9 0 11-3-6.7M21 3v5h-5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  spark: "M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4",
  check: "M20 6L9 17l-5-5",
  card: "M2 6h20v12H2zM2 10h20M6 15h4",
  // 實心飛機剪影（機身＋機翼＋尾翼），不是紙飛機箭頭——呼叫時記得加 fill={color} sw={0}，
  // 不然會套用 Icon 預設的 fill="none"，變成看不出形狀的線框。
  plane: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-6.5l8 2.5z",
};
