// REST Market Data cua DNSE OpenAPI (CHI DOC: GET /price/..., /market/...) - dung chu ky HMAC cua SDK chinh thuc (vendorSdk/common.cjs, GIU NGUYEN).
// Khac openApiClient.js (boc SDK, chi co getOhlc / getSecurityDefinition): SDK chua co ham cho trades / quotes / foreign-trading / market-index... nen goi truc tiep o day.
// KHONG co ham nao dat lenh / sua lenh / truy cap tai khoan o file nay. Khoa API chi lay tu bien moi truong (xem chayThuOpenApi.mjs), khong in ra.
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
const require = createRequire(import.meta.url);
const { buildSignature, formatDateHeader } = require("./vendorSdk/common.cjs");

export const URL_GOC_REST = "https://openapi.dnse.com.vn";

export function taoMarketData({ apiKey, apiSecret, baseUrl = URL_GOC_REST } = {}) {
  if (!apiKey || !apiSecret) throw new Error("Thieu apiKey/apiSecret DNSE - phai truyen tu bien moi truong.");
  const goc = baseUrl.replace(/\/$/, "");
  // GET path (khong gom query) + query -> { status, json | text }
  async function get(path, query = {}) {
    const url = new URL(goc + path);
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    const dateValue = formatDateHeader(new Date());
    const nonce = randomUUID().replace(/-/g, "");
    const { headers, signature } = buildSignature(apiSecret, "GET", path, dateValue, "hmac-sha256", nonce);
    const res = await fetch(url, {
      headers: { Date: dateValue, "x-api-key": apiKey, "X-Signature": `Signature keyId="${apiKey}",algorithm="hmac-sha256",headers="${headers}",signature="${signature}",nonce="${nonce}"` },
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* khong phai JSON */
    }
    return { status: res.status, json, text, headers: Object.fromEntries(res.headers.entries()) };
  }
  return {
    get,
    tradesGanNhat: (ma, boardId = "G1") => get(`/price/${ma}/trades/latest`, { boardId }),
    trades: (ma, from, to, { boardId = "G1", limit } = {}) => get(`/price/${ma}/trades`, { boardId, from, to, limit }),
    quotesGanNhat: (ma, boardId = "G1") => get(`/price/${ma}/quotes/latest`, { boardId }),
    nuocNgoai: (ma, from, to, { boardId = "G1", limit, order } = {}) => get(`/price/${ma}/foreign-trading`, { boardId, from, to, limit, order }),
    chiSo: (ten, { from, to, limit } = {}) => get(`/price/${ten}/market-index`, { from, to, limit }),
    danhSachMa: (query = {}) => get("/market/instruments", query),
  };
}
