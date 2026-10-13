// Tai lich su MUA / BAN CUA KHOI NGOAI theo tung ma (VNDirect finfo /v4/foreigns, co tu 30/08/2018) cho cac ma trong nen_dai.json
// -> engine/output/ngoai.json { ma: { t: ["yyyy-mm-dd"], bv: [KL mua], sv: [KL ban], nv: [gia tri mua rong, ty dong] } } tang dan theo ngay. Chi DOC.
// KL khoi ngoai gom ca giao dich thoa thuan nen co phien lon hon KL khop lenh.
// Chay: node engine/dich-vu/taiDuLieuNgoai.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output");
const ma = Object.keys(JSON.parse(readFileSync(path.join(GOC, "nen_dai.json"), "utf-8"))).filter((m) => m !== "VNINDEX");
const lay = async (u) => { for (let i = 0; i < 4; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(60000) }); if (r.ok) return await r.json(); } catch {} await new Promise((r) => setTimeout(r, 900 * (i + 1))); } return null; };
const out = {}; let k = 0, loi = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (k < ma.length) {
    const m = ma[k++]; const ds = [];
    for (let trang = 0; trang < 3; trang++) {
      const j = await lay(`https://api-finfo.vndirect.com.vn/v4/foreigns?q=code:${m}&sort=tradingDate:asc&size=1500&page=${trang + 1}&fields=tradingDate,buyVol,sellVol,netVal`);
      if (!j?.data?.length) break;
      ds.push(...j.data);
      if (j.data.length < 1500) break;
    }
    if (!ds.length) { loi++; continue; }
    const xem = new Map(ds.map((d) => [d.tradingDate, d])); const ngay = [...xem.keys()].sort();
    out[m] = { t: ngay, bv: ngay.map((d) => xem.get(d).buyVol || 0), sv: ngay.map((d) => xem.get(d).sellVol || 0), nv: ngay.map((d) => Math.round((xem.get(d).netVal || 0) / 1e7) / 100) };
  }
}));
writeFileSync(path.join(GOC, "ngoai.json"), JSON.stringify(out));
const n = Object.values(out).map((x) => x.t.length);
console.log("ma", Object.keys(out).length, "khong co du lieu", loi, "| TB so phien", Math.round(n.reduce((s, x) => s + x, 0) / n.length), "| som nhat", Object.values(out).map((x) => x.t[0]).sort()[0], "| muon nhat", Object.values(out).map((x) => x.t[x.t.length - 1]).sort().pop());
process.exit(0);
