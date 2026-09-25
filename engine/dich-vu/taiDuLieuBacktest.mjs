// Tai lich su gia (~4.4 nam) cua toan bo vu tru quet (VN30+Midcap+Smallcap) tu DNSE OpenAPI ra 1 file cache
// JSON cuc bo (engine/output/nen_backtest.json, da gitignore) - de cac script phan tich/backtest chay di chay
// lai KHONG phai goi lai API. Chi DOC du lieu, khong ghi/gui gi len web.
// CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/taiDuLieuBacktest.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { taoOpenApiClient } from "../dnse/openApiClient.js";
import { layNenAnToan, danhSachMaQuet } from "../loi/quetToanBo.js";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local.");
  process.exit(1);
}

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

const client = taoOpenApiClient({ apiKey, apiSecret });
const dsMa = danhSachMaQuet();
const ketQua = {};
const loi = [];
for (let i = 0; i < dsMa.length; i++) {
  const ma = dsMa[i];
  try {
    const nen = await layNenAnToan(client, ma, "STOCK");
    if (nen && nen.length >= 150) ketQua[ma] = nen;
    else loi.push(`${ma}: chi ${nen?.length ?? 0} nen`);
  } catch (e) {
    loi.push(`${ma}: ${String(e.message || e).slice(0, 80)}`);
  }
  if ((i + 1) % 25 === 0 || i === dsMa.length - 1) console.log(`${i + 1}/${dsMa.length} ma (${loi.length} loi)`);
  await cho(200);
}

const thuMuc = fileURLToPath(new URL("../output/", import.meta.url));
mkdirSync(thuMuc, { recursive: true });
const duongDan = thuMuc + "nen_backtest.json";
writeFileSync(duongDan, JSON.stringify(ketQua), "utf-8");
console.log(`Da luu ${Object.keys(ketQua).length} ma vao ${duongDan}`);
if (loi.length) console.log("Loi:", loi.slice(0, 20).join(" | "));
