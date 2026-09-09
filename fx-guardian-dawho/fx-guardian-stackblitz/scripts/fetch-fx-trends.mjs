#!/usr/bin/env node
// ============================================================
//  抓取永豐銀行 Orbit.AI「投資水晶球」外匯趨勢分析
//  ------------------------------------------------------------
//  來源頁面：https://bank.sinopac.com/sinopacBT/webevents/orbitai/
//  該頁面本身只是行銷入口，實際內容由前端 JS 呼叫下方 contentApi
//  動態取得（端點、Header、Body 皆擷取自該頁面公開的
//  js/event.securejs，屬於任何訪客瀏覽器都會發出的請求，
//  並非繞過任何登入或授權機制）。
//
//  用途：把回傳的市場分析文字整理成 src/data/fxTrends.ts 的內容，
//  作為換匯守衛 Agent 的「外部市場參考」。此腳本僅供人工重新
//  擷取快照時使用，不建議在正式環境即時呼叫（未知的速率限制、
//  且該內容為永豐銀行自身研究，非本專案資料，請勿大量存取或
//  另作商業用途；免責聲明見來源頁面）。
//
//  用法：node scripts/fetch-fx-trends.mjs
// ============================================================

const CONTENT_API = "https://bank.sinopac.com/sinopacBT/GenAIHub.html";
// 這組 key/projectId 是該頁面前端 JS 內建、隨頁面公開送出的識別碼，
// 不是帳號登入憑證，任何訪客的瀏覽器都會用同一組送出這個請求。
const API_KEY = "Ymv39c1LZr0CBw0GughY1Q==";
const PROJECT_ID = "orbitai";

// 對照 src/data/mockDb.ts 裡目前有支援的幣別
const TARGET_MARKETS = {
  USD: "美元",
  JPY: "日圓",
  CNY: "人民幣",
};

async function fetchTrend(targetMarket) {
  const res = await fetch(CONTENT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "API-key": API_KEY,
      ProjectId: PROJECT_ID,
    },
    body: JSON.stringify({ date: "latest", filter: { targetMarket } }),
  });

  if (!res.ok) {
    throw new Error(`${targetMarket}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const item = (data.result ?? []).find((r) => r.ischecked);
  if (!item) throw new Error(`${targetMarket}: 找不到已核可的內容`);
  return item;
}

for (const [ccy, targetMarket] of Object.entries(TARGET_MARKETS)) {
  try {
    const item = await fetchTrend(targetMarket);
    console.log(`\n===== ${ccy}（${targetMarket}） =====`);
    console.log("指數:", item.metadata?.indexName);
    console.log("資料日期:", item.metadata?.dataDate);
    console.log("永豐評等:", item.metadata?.viewPoint);
    console.log("週報摘要:", item.metadata?.article);
    console.log("\n--- 完整分析內容 ---\n");
    console.log(item.content);
  } catch (err) {
    console.error(`抓取 ${ccy} 失敗：`, err.message);
  }
}

console.log(
  "\n請將以上內容整理後，手動回填至 src/data/fxTrends.ts（FxTrendSummary），\n" +
    "並更新其中的 asOf 日期。"
);
