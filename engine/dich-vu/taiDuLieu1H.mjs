// Tai nen 1 GIO (DNSE chart-api, co tu ~10/2023, gia dieu chinh giong nen ngay) cua cac ma trong nen_dai.json -> engine/output/nen_1h.json {ma: {t:[giay], h,l,c,v}}. Chi DOC.
// Dung cho nghien cuu Volume Profile (khoi luong theo muc gia) sat hon ban xap xi tu nen ngay.
// Chay: node engine/dich-vu/taiDuLieu1H.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output");
const ma = Object.keys(JSON.parse(readFileSync(path.join(GOC, "nen_dai.json"), "utf-8"))).filter((m) => m !== "VNINDEX");
const tu = Math.floor(Date.parse("2023-09-01") / 1000), den = Math.floor(Date.now() / 1000);
const lay = async (u) => { for (let i = 0; i < 4; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(60000) }); if (r.ok) return await r.json(); } catch {} await new Promise((r) => setTimeout(r, 800 * (i + 1))); } return null; };
const out = {}; let k = 0, loi = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (k < ma.length) {
    const m = ma[k++];
    const j = await lay(`https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?symbol=${m}&resolution=1H&from=${tu}&to=${den}`);
    if (j?.t?.length) out[m] = { t: j.t, h: j.h, l: j.l, c: j.c, v: j.v }; else loi++;
  }
}));
writeFileSync(path.join(GOC, "nen_1h.json"), JSON.stringify(out));
const n = Object.values(out).map((x) => x.t.length);
console.log("ma", Object.keys(out).length, "loi", loi, "| TB nen", Math.round(n.reduce((s, x) => s + x, 0) / n.length), "| som nhat", new Date(Math.min(...Object.values(out).map((x) => x.t[0])) * 1000).toISOString().slice(0, 10));
process.exit(0);
