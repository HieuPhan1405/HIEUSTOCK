// NGHIEN CUU (2026-10-13): "ti le mua/ban cua CHINH MA" luc mua - lenh web giu vs lenh he thong giu (lenh_mua_chot dang mo). Chua co so lenh mua/ban that (dư mua/dư bán, mua/ban chu dong) nen dung 2 nhom thay the:
//  (1) ap luc mua tu OHLCV ngay (vi tri dong cua gia quyen khoi luong, ty trong khoi luong phien tang, khoi luong tang/giam 10 phien) TRUOC ngay mua;
//  (2) khoi ngoai cua ma (VNDirect /v4/foreigns): mua rong / ban rong theo gia tri, % so voi gia tri khop.
// Chay: node engine/dich-vu/nghienCuuWebGiuMa.mjs <lmc.json>
import { readFileSync } from "node:fs";
const L = JSON.parse(readFileSync(process.argv[2], "utf-8")).dong.filter((l) => l.trang_thai === "mo");
const GOC = "https://www.cloudstock.id.vn";
const lay = async (u) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (r.ok) return await r.json(); } catch {} await new Promise((r) => setTimeout(r, 500 * (i + 1))); } return null; };
const maList = [...new Set(L.map((l) => l.ma))];
const nen = {}, ngoai = {};
await Promise.all(maList.map(async (m) => {
  const j = await lay(`${GOC}/api/gia-lich-su?ma=${m}&kt=D`); if (j?.nen) nen[m] = j.nen.slice(-120);
  const f = await lay(`https://api-finfo.vndirect.com.vn/v4/foreigns?q=code:${m}~tradingDate:gte:2026-07-01&sort=tradingDate&size=200&fields=code,tradingDate,buyVal,sellVal,netVal`);
  ngoai[m] = new Map((f?.data || []).map((x) => [x.tradingDate, x]));
}));
const feat = (l) => {
  const d = String(l.ngay_mua).slice(0, 10); const b = nen[l.ma]; if (!b) return null; const i = b.findIndex((x) => x.t === d); if (i < 12) return null;
  const k = i - 1; // phien truoc ngay mua (thong tin da biet luc mua)
  const aps = (n) => { let a = 0, w = 0; for (let j = k - n + 1; j <= k; j++) { const r = b[j].h - b[j].l || 1e-9; a += ((b[j].c - b[j].l) / r) * b[j].v; w += b[j].v; } return a / w; };
  const up = (n) => { let u = 0, w = 0; for (let j = k - n + 1; j <= k; j++) { if (b[j].c >= b[j - 1].c) u += b[j].v; w += b[j].v; } return u / w; };
  let U = 0, D = 0; for (let j = k - 9; j <= k; j++) { if (b[j].c >= b[j - 1].c) U += b[j].v; else D += b[j].v; }
  const fn = (j) => { const x = ngoai[l.ma].get(b[j].t); return x ? { net: x.netVal / 1e9, gt: x.buyVal + x.sellVal, tong: (b[j].c * b[j].v * 1000) / 1e9 } : null; };
  const f1 = fn(k); let f3 = 0, f3ok = 0; for (let j = k - 2; j <= k; j++) { const x = fn(j); if (x) { f3 += x.net; f3ok++; } }
  const fd = fn(i);
  return { ma: l.ma, d, web: !!l.web_giu, ap3: aps(3), up3: up(3), updn: U / Math.max(D, 1), clv1: (b[k].c - b[k].l) / (b[k].h - b[k].l || 1e-9), gap: (b[i].o / b[k].c - 1) * 100, volRel: b[k].v / (b.slice(k - 19, k + 1).reduce((s, x) => s + x.v, 0) / 20), fNet1: f1?.net ?? null, fNet3: f3ok ? f3 : null, fNetD: fd?.net ?? null, fVal: fd ? (fd.net / Math.max(fd.tong, 1e-9)) * 100 : null };
};
const R = L.map(feat).filter(Boolean);
const med = (a) => { a = a.filter((x) => x != null && Number.isFinite(x)).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };
const tb = (a) => { a = a.filter((x) => x != null && Number.isFinite(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN; };
const W = R.filter((x) => x.web), H = R.filter((x) => !x.web);
const f = (v, n = 2) => (Number.isFinite(v) ? v.toFixed(n) : "-");
// kiem dinh hoan vi (chenh trung vi)
function hv(k) { const a = W.map((x) => x[k]).filter(Number.isFinite), b = H.map((x) => x[k]).filter(Number.isFinite); const g = [...a, ...b]; if (a.length < 4) return NaN; const dm = med(a) - med(b); let c = 0, s = 7; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); for (let t = 0; t < 4000; t++) { for (let i = g.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; } if (Math.abs(med(g.slice(0, a.length)) - med(g.slice(a.length))) >= Math.abs(dm) - 1e-12) c++; } return c / 4000; }
console.log("lenh co du lieu:", R.length, "| web giu", W.length, "| he thong giu", H.length);
console.log("\nChi so (truoc/ngay mua)".padEnd(58), "TV web giu", "TV he thong", "p(hoan vi)");
for (const [k, ten] of [["ap3", "Ap luc mua 3 phien truoc (1 = dong sat cao)"], ["up3", "Ty trong KL phien tang 3 phien truoc"], ["updn", "KL phien tang / giam 10 phien truoc"], ["clv1", "Vi tri dong cua phien truoc ngay mua"], ["gap", "Gap mo cua ngay mua (%)"], ["volRel", "KL phien truoc / TB20"], ["fNet1", "Khoi ngoai rong CUA MA phien truoc (ty)"], ["fNet3", "Khoi ngoai rong CUA MA 3 phien truoc (ty)"], ["fNetD", "Khoi ngoai rong CUA MA ngay mua (ty, sau su kien)"], ["fVal", "Khoi ngoai rong / GT khop ngay mua (%)"]])
  console.log(ten.padEnd(58), f(med(W.map((x) => x[k]))).padStart(10), f(med(H.map((x) => x[k]))).padStart(12), f(hv(k), 2).padStart(10));
const dem = (g, fn) => `${g.filter(fn).length}/${g.length}`;
console.log("\nKhoi ngoai CUA MA ngay mua: ban rong:", "web giu", dem(W.filter((x) => x.fNetD != null), (x) => x.fNetD < 0), "| he thong giu", dem(H.filter((x) => x.fNetD != null), (x) => x.fNetD < 0));
console.log("Khoi ngoai CUA MA 3 phien truoc: ban rong:", "web giu", dem(W.filter((x) => x.fNet3 != null), (x) => x.fNet3 < 0), "| he thong giu", dem(H.filter((x) => x.fNet3 != null), (x) => x.fNet3 < 0));
console.log("Ap luc mua 3 phien truoc < 0,5 (ben ban thang):", "web giu", dem(W, (x) => x.ap3 < 0.5), "| he thong giu", dem(H, (x) => x.ap3 < 0.5));
console.log("\nChi tiet lenh web giu: ma | ngay mua | ap3 | up3 | KL tang/giam 10p | ngoai rong 3p truoc | ngoai rong ngay mua (ty)");
for (const x of W) console.log(`  ${x.ma.padEnd(5)} ${x.d} | ${f(x.ap3)} | ${f(x.up3)} | ${f(x.updn, 1)} | ${f(x.fNet3, 1)} | ${f(x.fNetD, 1)}`);
process.exit(0);
