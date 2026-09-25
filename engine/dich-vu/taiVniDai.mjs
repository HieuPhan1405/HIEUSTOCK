// Tai lich su NGAY DAI cua VNINDEX (tu 2013, DNSE chart-api, ~13 nam) ra engine/output/vnindex_dai.json (da gitignore) - dung cho backtest bo loc thi truong
// (backtestLocThiTruong.mjs). Dinh dang giong vnindex_backtest.json: [{ t:"YYYY-MM-DD", o, h, l, c, v }] tang dan theo ngay. Chi DOC mang, ghi 1 file cuc bo.
// CACH CHAY: node engine/dich-vu/taiVniDai.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const tu = Math.floor(Date.parse("2013-01-01") / 1000);
const den = Math.floor(Date.now() / 1000);
const res = await fetch(`https://services.entrade.com.vn/chart-api/v2/ohlcs/index?symbol=VNINDEX&resolution=1D&from=${tu}&to=${den}`, { signal: AbortSignal.timeout(60000) });
if (!res.ok) throw new Error(`DNSE tra loi HTTP ${res.status}`);
const j = await res.json();
if (!Array.isArray(j.t) || j.t.length < 1000) throw new Error("DNSE khong tra du lieu VNINDEX dai");
const nen = j.t.map((t, i) => ({ t: new Date(t * 1000).toISOString().slice(0, 10), o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 })).filter((b) => b.c > 0 && b.h >= b.l);
// Bo trung ngay (giu nen cuoi)
const theoNgay = new Map();
for (const b of nen) theoNgay.set(b.t, b);
const ds = [...theoNgay.values()].sort((a, b) => (a.t < b.t ? -1 : 1));
const thuMuc = fileURLToPath(new URL("../output/", import.meta.url));
mkdirSync(thuMuc, { recursive: true });
writeFileSync(thuMuc + "vnindex_dai.json", JSON.stringify(ds), "utf-8");
console.log(`Da luu ${ds.length} nen VNINDEX: ${ds[0].t} (${ds[0].c}) -> ${ds[ds.length - 1].t} (${ds[ds.length - 1].c})`);
