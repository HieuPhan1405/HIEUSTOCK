// BAT DAY NHIP HOI TREN KHUNG NHO (Hieu 2026-10-21: "tim giai phap nhu gia tren Tenkan, Kijun, vol oke co the vao bat day, vao khung nho").
// Boi canh NGAY (dung phien truoc, khong nhin truoc): co phieu da giam sau (dong cua <= 88% dinh 20 phien) - "vung bat day". Tin hieu vao tren NEN 1 GIO (nen_1h.json 10/2023-10/2026, 387 ma, Ichimoku 9-17 tren nen 1 gio):
//   B  : Tenkan 1H vua cat LEN Kijun 1H (trong 3 nen gan nhat) va dong cua nen > ca Tenkan va Kijun (gia tren Tenkan va Kijun);
//   C  : KL nen 1 gio >= 1,3x TB 20 nen truoc (volume ok);
//   D  : khoi luong TREO tren dau thap: < 15% KL 120 phien nam o gia >= 105% gia hien tai (nghienCuuChotLoi.mjs: yeu to quan trong nhat tim duoc);
//   E  : dong cua ngay hom truoc > Kijun ngay (gia da lay lai Kijun ngay) - tuy chon.
// Vao: dong cua nen 1 gio tin hieu (bo neu da la nen cuoi ngay); hang ve T+2,5: chi ban tu nen 13:00 ngay T+2. Thoat: (a) giu 3 / 5 / 10 ngay (dong cua), (b) chot +8% / cat -5% (toi da 10 ngay). Phi 0,4%. Moi ma 1 tin hieu / 10 nen.
// So voi doi chieu: chi co boi canh (khong co trigger) va trigger khong boi canh. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuBatDayKhungNho.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const h1 = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_1h.json", import.meta.url)), "utf-8"));
const CP = 0.4;
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);
const gioVN = (t) => new Date((t + 7 * 3600) * 1000).getUTCHours();
const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };

const NHOM = {
  "Boi canh ngay (giam sau, khong trigger)": [],
  "B: Tenkan1H cat len Kijun1H + gia tren ca hai (khong boi canh)": [],
  "Boi canh + B": [],
  "Boi canh + B + C (volume ok)": [],
  "Boi canh + B + C + D (it KL treo tren dau)": [],
  "Boi canh + B + D": [],
  "Boi canh + B + C + D + E (gia > Kijun ngay)": [],
};
const DEDUP = 10;
for (const [ma, x] of Object.entries(h1)) {
  const D = cache[ma];
  if (!D || D.length < 300) continue;
  const n = x.t.length; if (n < 120) continue;
  const c = x.c, hi = x.h, lo = x.l, v = x.v;
  const ngay = x.t.map(ngayVN), gio = x.t.map(gioVN);
  const dIdx = new Map(D.map((b, i) => [b.t, i]));
  const ds = [], dayOf = new Array(n);
  for (let i = 0; i < n; i++) { if (i === 0 || ngay[i] !== ngay[i - 1]) ds.push({ start: i, end: i }); dayOf[i] = ds.length - 1; ds[ds.length - 1].end = i; }
  const tenkan = new Array(n).fill(null), kijun = new Array(n).fill(null);
  for (let i = 17; i < n; i++) { tenkan[i] = (hh(hi, i, 9) + ll(lo, i, 9)) / 2; kijun[i] = (hh(hi, i, 17) + ll(lo, i, 17)) / 2; }
  const dc = D.map((b) => b.c), dh = D.map((b) => b.h), dl = D.map((b) => b.l), dv = D.map((b) => b.v);
  // Kijun ngay (17)
  const dKij = D.map((_, i) => (i >= 16 ? (hh(dh, i, 17) + ll(dl, i, 17)) / 2 : null));
  const ctxCache = new Map();
  const ngCtx = (d) => { // thong tin ngay d-1 (phien giao dich truoc ngay d)
    if (ctxCache.has(d)) return ctxCache.get(d);
    let k = null;
    // phien truoc: ngay lon nhat < d co trong cache ngay
    let j = dIdx.get(d); if (j == null) { ctxCache.set(d, null); return null; }
    j -= 1;
    if (j < 130) { ctxCache.set(d, null); return null; }
    const c0 = dc[j];
    const gt = (() => { let s = 0; for (let q = j - 19; q <= j; q++) s += (dc[q] * dv[q]) / 1e6; return s / 20; })();
    if (gt < 10) { ctxCache.set(d, null); return null; }
    const giam = c0 <= 0.88 * hh(dh, j, 20);
    let tong = 0, treo = 0;
    for (let q = j - 119; q <= j; q++) { const g = (dh[q] + dl[q] + dc[q]) / 3; tong += dv[q] || 0; if (g >= 1.05 * c0) treo += dv[q] || 0; }
    k = { giam, treo: (treo / tong) * 100, tren: dKij[j] != null && c0 > dKij[j] };
    ctxCache.set(d, k);
    return k;
  };
  const ult = {};
  const them = (ten, i) => { if (ult[ten] != null && i - ult[ten] < DEDUP) return; ult[ten] = i; NHOM[ten].push({ ma, i, ngay: ngay[i], d: { n, c, lo, hi, ngay, gio, dayOf, ds } }); };
  for (let i = 40; i < n - 1; i++) {
    if (tenkan[i] == null || kijun[i] == null || gio[i] < 9) continue;
    const ctx = ngCtx(ngay[i]);
    if (!ctx) continue;
    const trig = c[i] > tenkan[i] && c[i] > kijun[i] && tenkan[i] > kijun[i] && [1, 2, 3].some((k) => tenkan[i - k] != null && tenkan[i - k] <= kijun[i - k]);
    let tbv = 0; for (let j = i - 20; j < i; j++) tbv += v[j]; tbv /= 20;
    const vol = tbv > 0 && v[i] >= 1.3 * tbv;
    if (ctx.giam && i % 5 === 0) them("Boi canh ngay (giam sau, khong trigger)", i);
    if (trig) them("B: Tenkan1H cat len Kijun1H + gia tren ca hai (khong boi canh)", i);
    if (ctx.giam && trig) them("Boi canh + B", i);
    if (ctx.giam && trig && vol) them("Boi canh + B + C (volume ok)", i);
    if (ctx.giam && trig && ctx.treo < 15) them("Boi canh + B + D", i);
    if (ctx.giam && trig && vol && ctx.treo < 15) them("Boi canh + B + C + D (it KL treo tren dau)", i);
    if (ctx.giam && trig && vol && ctx.treo < 15 && ctx.tren) them("Boi canh + B + C + D + E (gia > Kijun ngay)", i);
  }
}
function banDuoc(d, e) { const dd = d.dayOf[e.i] + 2; if (dd >= d.ds.length) return -1; for (let i = d.ds[dd].start; i <= d.ds[dd].end; i++) if (d.gio[i] >= 13) return i; return d.ds[dd].end; }
const hold = (H) => (e) => { const d = e.d; const dd = d.dayOf[e.i] + H; if (dd >= d.ds.length) return null; return (d.c[d.ds[dd].end] / d.c[e.i] - 1) * 100 - CP; };
const tpsl = (tp, sl, maxD) => (e) => {
  const d = e.d, E = d.c[e.i], b = banDuoc(d, e); if (b < 0) return null;
  const fin = d.dayOf[e.i] + maxD; if (fin >= d.ds.length) return null;
  const last = d.ds[fin].end;
  for (let i = b; i <= last; i++) {
    if (d.lo[i] <= E * (1 - sl / 100)) return (Math.min(E * (1 - sl / 100), d.c[i - 1] ?? E) / E - 1) * 100 - CP;
    if (d.hi[i] >= E * (1 + tp / 100)) return tp - CP;
  }
  return (d.c[last] / E - 1) * 100 - CP;
};
const EXITS = [["giu 3 ngay", hold(3)], ["giu 5 ngay", hold(5)], ["giu 10 ngay", hold(10)], ["chot +8% / cat -5% (10 ngay)", tpsl(8, 5, 10)]];
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d2 = 2) => (Number.isFinite(x) ? x.toFixed(d2) : "-");
const pf = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
for (const [ten, arr] of Object.entries(NHOM)) {
  console.log(`\n=== ${ten}: ${arr.length} tin hieu ===`);
  for (const [tx, fn] of EXITS) {
    const kq = arr.map((e) => ({ e, r: fn(e) })).filter((x) => x.r != null);
    const a = kq.map((x) => x.r);
    const py = (y) => { const z = kq.filter((x) => x.e.ngay.slice(0, 4) === y).map((x) => x.r); return z.length ? `${f(tb(z))} (${z.length})` : "-"; };
    console.log(`  ${tx.padEnd(30)} n=${String(a.length).padStart(5)} TB ${f(tb(a)).padStart(6)}% thang ${f((a.filter((x) => x > 0).length / Math.max(a.length, 1)) * 100, 0).padStart(3)}% PF ${f(pf(a)).padStart(5)} | 2023-24: ${py("2023") === "-" ? py("2024") : py("2024")}  2025: ${py("2025")}  2026: ${py("2026")}`);
  }
}
