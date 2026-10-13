// Tai nen 15 PHUT (~6,5 thang, tu 31/03/2026) cua cac ma trong vu tru quet tu VNDirect dchart -> file JSON {ma: {t:[giay], o,h,l,c,v}} (gia dieu chinh). Chi DOC.
// Chay: node engine/dich-vu/taiDuLieu15p.mjs <danh_sach_ma.json> <ra.json>   (danh sach ma: mang chuoi hoac /api/signals)
import { readFileSync, writeFileSync } from "node:fs";
const dau = JSON.parse(readFileSync(process.argv[2], "utf-8"));
const ma = (Array.isArray(dau) ? dau : dau.tinHieu.map((r) => r.ma)).filter((m) => m !== "VNINDEX");
const tu = Math.floor(Date.parse("2026-03-30") / 1000), den = Math.floor(Date.now() / 1000);
const lay = async (u) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(60000) }); if (r.ok) return await r.json(); } catch {} await new Promise((r) => setTimeout(r, 700 * (i + 1))); } return null; };
const out = {}; let k = 0, loi = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (k < ma.length) { const m = ma[k++]; const j = await lay(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=15&symbol=${m}&from=${tu}&to=${den}`); if (j?.t?.length) out[m] = { t: j.t, o: j.o, h: j.h, l: j.l, c: j.c, v: j.v }; else loi++; if (k % 80 === 0) console.log(k + "/" + ma.length); } }));
writeFileSync(process.argv[3], JSON.stringify(out));
console.log("ma", Object.keys(out).length, "loi", loi, "| TB nen", Math.round(Object.values(out).reduce((s, x) => s + x.t.length, 0) / Object.keys(out).length));
process.exit(0);
