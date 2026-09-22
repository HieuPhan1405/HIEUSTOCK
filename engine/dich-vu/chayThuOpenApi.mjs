// CONG CU CHAN DOAN - goi that API DNSE OpenAPI (ky HMAC bang SDK chinh thuc cua DNSE) de lay
// lich su OHLC 1 mã, in ra ket qua. Thay the huong MQTT/LightSpeed cu (khong subscribe duoc) -
// nen tang moi dung API Key + API Secret (khac han username/password).
//
// CACH CHAY:
//   1. Sua/them vao file .env.dnse.local (KHONG commit - da trong .gitignore qua ".env*"):
//        DNSE_API_KEY=<API Key cua ban, lay tu trang dang ky dich vu DNSE OpenAPI>
//        DNSE_API_SECRET=<API Secret cua ban - CHI hien 1 lan luc dang ky, luu lai truoc do>
//      Chi ban tu go, khong dua cho ai/AI nao khac.
//   2. Chay: node --env-file=.env.dnse.local engine/dich-vu/chayThuOpenApi.mjs VJC
import { taoOpenApiClient, layNenOHLC } from "../dnse/openApiClient.js";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local. Xem huong dan o dau file nay.");
  process.exit(1);
}

const ma = (process.argv[2] || "VJC").toUpperCase();
const den = Math.floor(Date.now() / 1000);
const tu = den - 30 * 86400; // 30 ngay gan nhat, du de thay vai nen

console.log(`Dang goi DNSE OpenAPI lay lich su OHLC cho ${ma} (30 ngay gan nhat)...`);
const client = taoOpenApiClient({ apiKey, apiSecret });
try {
  const nen = await layNenOHLC(client, { symbol: ma, type: "STOCK", resolution: "1D", tu, den });
  console.log(`Thanh cong! Nhan duoc ${nen.length} nen:`);
  console.log(JSON.stringify(nen.slice(-5), null, 2));
} catch (loi) {
  console.error("That bai:", loi.message);
  process.exit(1);
}
