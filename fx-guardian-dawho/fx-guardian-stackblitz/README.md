# FX Guardian POC — 換匯守衛代理人

DAWHO 風格的換匯守衛 (FX Guardian) 原型：TypeScript + React (Vite) 前端，Express 後端代理，代理人由 Claude API 即時推理驅動。

> 這是自製原型 UI，非永豐大戶 App 專屬視覺的複製。品牌色、版面請對照真實 App 自行微調（見「調整外觀」）。

## 一、跑起來

這個專案有兩種跑法。

### A. 線上（StackBlitz，最快，別人也能開）

1. 到 https://stackblitz.com ，選 "Open project" / 從 GitHub 或上傳資料夾匯入。
2. StackBlitz 會自動 `npm install` 並執行 `npm run dev`。
3. 右側預覽視窗就會顯示畫面，網址列的連結分享給任何人都能開。

線上版預設是**示範模式（免金鑰）**：換匯守衛的回應由內建腳本產生（會依模式與匯率狀態變化、並用真實數字試算），不需要後端、不需要金鑰。

### B. 本機（VS Code）

免金鑰、只跑前端示範模式：
```bash
npm install
npm run dev          # 前端 http://localhost:5173
```

接真 Claude API（需要金鑰 + 後端）：
```bash
cp .env.example .env         # 填 ANTHROPIC_API_KEY
# 再建一個 .env.local，寫入： VITE_USE_BACKEND=true
npm run dev:full             # 同時起前端 + Express 後端
```

## 模式切換：示範腳本 vs 真 Claude API

- 預設（`VITE_USE_BACKEND` 未設或非 true）→ 前端內建示範腳本，見 `src/agent/mockReply.ts`。
- `VITE_USE_BACKEND=true` → 前端改打後端 `/api/fx-agent`，由 `server/index.ts` 用金鑰轉呼叫 Claude。

## 二、三種換匯模式（代理人邏輯）

| 模式 | 設定 | 行為 | 自主性 |
|---|---|---|---|
| 1 觸價執行 | 門檻 | 達門檻即自動換 | 全自主 |
| 2 區間找低點 | 時間段 | 區間內擇低點；到期用當日匯率保證完成 | 擇時自主 |
| 3 門檻＋區間 | 門檻＋時間段 | 觸價後若可能更低 → **只示警建議，客戶拍板**；到期用當日匯率 | AI 建議、人拍板 |

切換模式：改 `src/data/mockDb.ts` 裡 `fxWatch[0].mode`。

Demo 預設 `mode: 3` 且落在 **advise（示警建議）** 狀態。要看其他狀態：
- **execute**：`mode` 改 1，或把 `window_end` 改成早於 `today`
- **none**：把 `fxRates.USD.bank_sell` 提高到門檻之上（如 31.85）

## 三、換成你的真實資料

所有資料集中在 **`src/data/mockDb.ts`**，型別定義在 **`src/types/fx.ts`**。
把 `mockDb` 換成你的資料（或改成 fetch 後 shape 成 `FxDatabase`）即可，其餘不用動。

判讀規則（尤其模式 2/3 的「相對低點」）在 **`src/agent/opportunity.ts`**，
目前用「低於 20 日均價」當佔位判準 —— 換成你們實際的演算法就在這支檔案。

代理人給 Claude 的系統提示在 **`src/agent/fxGuardian.ts`** 的 `buildSystemPrompt()`。

## 四、調整外觀

配色與所有樣式集中在 **`src/styles/theme.ts`**：先改最上面的 `C`（palette）色票，
其餘樣式都引用它。想更貼近大戶 App，把主色、卡片圓角、字級往真實 App 對齊即可。

## 五、專案結構

```
src/
  types/fx.ts          型別（真實 schema 落地時先改這）
  data/mockDb.ts       假資料庫（換成真資料的地方）
  data/format.ts       數字/幣別格式化
  agent/opportunity.ts 三模式狀態判斷（換演算法的地方）
  agent/fxGuardian.ts  代理人 client + 系統提示
  styles/theme.ts      配色與樣式（改外觀的地方）
  components/          畫面元件（Home / Agent / Common）
  App.tsx              組裝
server/
  index.ts             Express 後端代理（金鑰藏這）
```

## 六、正式部署提醒

- `.env`（金鑰）已被 git 忽略，切勿 commit。
- 正式環境請把後端換成你們自己的服務，並加上身分驗證與速率限制。
- 目前 `max_tokens` 設 1024，可於 `server/index.ts` 調整。
