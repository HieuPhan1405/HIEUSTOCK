// DIEM B KHUNG 1 GIO, GIAM >= 30%, DE LUOT (Hieu 2026-10-21: "test diem B giam >= 30% khung 1 gio de luot; BDS va CK giam manh roi, kho giam duoc nua, view co nhip hoi de vao tien").
// BOI CANH NGAY (phien lien truoc, khong nhin truoc): muc giam = giam sau nhat trong 11 phien gan nhat tu dinh 20 phien (dong cua), chia dai 15-20 / 20-30 / >= 30%, GTGD TB20 >= 3 ty.
// DIEM B 1H: dong cua nen 1H > Tenkan 9 va Kijun 17 (khung 1 gio), day thap nhat 40 nen 1H gan nhat (~10 phien) cach nen hien tai >= 3 nen, bo nen 9h dau, moi ma 1 diem / 20 nen 1H.
// VAO: mo cua nen 1H ke tiep (thuc te, vi dong cua nen tin hieu da la gia luc biet), phi 0,4%. T+2,5: chi ban tu nen 13h cua phien D+2 (D = phien vao). Do: (A) lai neu ban dong cua phien D+2 / D+3 / D+5 / D+10 (TB [thang%]);
// (B) quan ly lenh: S1 = cat lo -4% / chot +5% (5 phien), S2 = -5% / +8% (10 phien), S3 = -7% / +10% (10 phien); xet bang nen 1H tu 13h D+2, cat lo khop gia SL hoac gia dong cua nen truoc neu thap hon.
// Du lieu 1H: engine/output/nen_1h.json (10/2023 - 10/2026, 387 ma) nen chi ~3 nam, mau nho hon cac test ngay. Chia: 2023-24 / 2025 / 2026, va rieng BDS + CK. Doi chieu: boi canh ngay khong co trigger (moi 5 nen). CHI DOC cache.
// CACH CHAY: node engine/dich-vu/nghienCuuDiemB1H.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const h1 = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_1h.json", import.meta.url)), "utf-8"));
const CP = 0.4;
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);
const gioVN = (t) => new Date((t + 7 * 3600) * 1000).getUTCHours();
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);
const nganhSet = (...t) => new Set(t.flatMap((k) => [...(NGANH.get(k) ?? [])]));
const BDS_CK = new Set([...nganhSet("Bat dong san", "BDS Khu cong nghiep", "Chung khoan")]);
const BUCKET = [["giam 15-20%", 15, 20], ["giam 20-30%", 20, 30], ["giam >= 30%", 30, 999]];
const HOLD = [2, 3, 5, 10];
const QL = { S1: [4, 5, 5], S2: [5, 8, 10], S3: [7, 10, 10] }; // [SL%, TP%, so phien toi da]

const ev = {}; const them = (k, e) => (ev[k] ||= []).push(e);
for (const [ma, x] of Object.entries(h1)) {
  const D = cache[ma]; if (!D || D.length < 300) continue;
  const n = x.t.length; if (n < 120) continue;
  const c = x.c, hi = x.h, lo = x.l, v = x.v, o = x.o ?? x.c;
  const ngay = x.t.map(ngayVN), gio = x.t.map(gioVN);
  const dIdx = new Map(D.map((b, i) => [b.t, i]));
  const ds = [], dayOf = new Array(n);
  for (let i = 0; i < n; i++) { if (i === 0 || ngay[i] !== ngay[i - 1]) ds.push({ start: i, end: i }); dayOf[i] = ds.length - 1; ds[ds.length - 1].end = i; }
  const tk = new Array(n).fill(null), kj = new Array(n).fill(null);
  for (let i = 17; i < n; i++) { tk[i] = (hh(hi, i, 9) + ll(lo, i, 9)) / 2; kj[i] = (hh(hi, i, 17) + ll(lo, i, 17)) / 2; }
  const dc = D.map((b) => b.c), dh = D.map((b) => b.h), dv = D.map((b) => b.v);
  const ctxCache = new Map();
  const ctx = (d) => {
    if (ctxCache.has(d)) return ctxCache.get(d);
    let r = null; const j0 = dIdx.get(d);
    if (j0 != null && j0 - 1 >= 130) {
      const j = j0 - 1; let gt = 0; for (let q = j - 19; q <= j; q++) gt += (dc[q] * dv[q]) / 1e6;
      if (gt / 20 >= 3) { let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - dc[j - k] / hh(dh, j - k, 20)) * 100); r = giam; }
    }
    ctxCache.set(d, r); return r;
  };
  const dung = BDS_CK.has(ma);
  let ult = -99;
  for (let i = 40; i < n - 2; i++) {
    if (tk[i] == null || gio[i] < 10) continue; // bo nen 9h
    const giam = ctx(ngay[i]); if (giam == null) continue;
    const bk = BUCKET.find(([, lo2, hi2]) => giam >= lo2 && giam < hi2); if (!bk) continue;
    const e = i + 1; // vao mo cua nen ke tiep
    const day40 = ll(lo, i, 40); let kDay = i; for (let j = i - 39; j <= i; j++) if (lo[j] <= day40) kDay = j;
    const sinhB = c[i] > tk[i] && c[i] > kj[i] && i - kDay >= 3 && i - ult >= 20;
    const base = (k, ex) => { if (!ex) return; them(k, ex); };
    const dg = (extra) => ({ ma, ngay: ngay[i], nam: ngay[i].slice(0, 4), dung, i, e, ds, dayOf, gio, c, lo, hi, o, ...extra });
    if (i % 5 === 0) base(`${bk[0]}|CS`, dg({}));
    if (sinhB) { ult = i; base(`${bk[0]}|B`, dg({})); }
  }
}
function banDuoc(d) { const dd = d.dayOf[d.e] + 2; if (dd >= d.ds.length) return -1; for (let i = d.ds[dd].start; i <= d.ds[dd].end; i++) if (d.gio[i] >= 13) return i; return d.ds[dd].end; }
const giuDen = (H) => (d) => { const dd = d.dayOf[d.e] + H; if (dd >= d.ds.length) return null; return (d.c[d.ds[dd].end] / d.o[d.e] - 1) * 100 - CP; };
const quanLy = ([sl, tp, maxD]) => (d) => {
  const E = d.o[d.e], b = banDuoc(d); if (b < 0) return null;
  const fin = d.dayOf[d.e] + maxD; if (fin >= d.ds.length) return null;
  const last = d.ds[fin].end;
  for (let i = b; i <= last; i++) {
    if (d.lo[i] <= E * (1 - sl / 100)) return (Math.min(E * (1 - sl / 100), d.c[i - 1] ?? E) / E - 1) * 100 - CP;
    if (d.hi[i] >= E * (1 + tp / 100)) return tp - CP;
  }
  return (d.c[last] / E - 1) * 100 - CP;
};
const ra = (arr, fn) => arr.map((d) => fn(d)).filter((x) => x != null);
function dongKQ(ten, arr) {
  if (arr.length < 20) { console.log(`   ${ten.padEnd(28)} n=${arr.length} (it mau)`); return; }
  const A = HOLD.map((H) => ra(arr, giuDen(H)));
  const Q = Object.entries(QL).map(([k, p]) => [k, ra(arr, quanLy(p))]);
  console.log(`   ${ten.padEnd(28)} n=${String(arr.length).padStart(4)} | ${HOLD.map((H, i) => `D+${H} ${f(tb(A[i])).padStart(5)}[${f(th(A[i]), 0)}%]`).join(" ")} | ${Q.map(([k, a]) => `${k} ${f(tb(a)).padStart(5)}[${f(th(a), 0)}%]`).join(" ")}`);
}
const KY = [["TOAN BO (10/2023-10/2026)", () => true], ["2023-24", (d) => d.nam <= "2024"], ["2025", (d) => d.nam === "2025"], ["2026", (d) => d.nam === "2026"], ["RIENG BDS + CK", (d) => d.dung]];
for (const [tk, loc] of KY) {
  console.log(`\n######## ${tk} ######## (A) ban dong cua D+h; (B) S1 -4/+5 5p, S2 -5/+8 10p, S3 -7/+10 10p`);
  for (const [bk] of BUCKET) { dongKQ(`${bk} | diem B 1H`, (ev[`${bk}|B`] ?? []).filter(loc)); dongKQ(`${bk} | co so (khong B)`, (ev[`${bk}|CS`] ?? []).filter(loc)); }
}
