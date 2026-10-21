// NHIP HOI GAN DAY CUA BDS / THEP / CHUNG KHOAN - TIM QUY LUAT (Hieu 2026-10-21: "dua vao nhung ma bds, thep, ck hoi gan day, hay tim ra quy luat co the vao lenh hieu qua").
// Buoc 1 (file nay): mo ta nhip hoi vua qua - moi ma (GTGD TB20 >= 3 ty) lay DAY thap nhat 45 phien gan nhat, do muc hoi tu day (dinh sau day / gia hien tai), va cac DAC TRUNG truoc / tai day:
//   giam tu dinh 250p, giam tu dinh 20p (toc do sap), so phien tu dinh 60p toi day, KL phien day / TB20, KL lon nhat 5 phien quanh day / TB20, RSI14 tai day, phan ky RSI (day sau thap hon day truoc trong 40p nhung RSI cao hon),
//   KL treo tren dau (% KL 120 phien o gia >= 105% gia day), vi tri so MA200 / MA50 tai day, suc manh tuong doi (ma giam - VN-Index giam cung cua so 20p), day truoc hay sau VN-Index (VN-Index chua tao day -> dau hieu dan dat),
//   3 phien dau sau day: muc hoi + KL phien tang / TB20.
// In bang theo muc hoi tu day, va tuong quan (Spearman) giua tung dac trung voi muc hoi. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuNhipHoiGanDay.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const vIdx = new Map(vni.map((x, i) => [x.t, i]));
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const sma = (a, i, n) => { let s = 0; for (let j = i - n + 1; j <= i; j++) s += a[j]; return s / n; };
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
export function rsiArr(c) {
  const o = new Array(c.length).fill(null); let ag = 0, al = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i <= 14) { ag += g / 14; al += l / 14; } else { ag = (ag * 13 + g) / 14; al = (al * 13 + l) / 14; }
    if (i >= 14) o[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return o;
}
// Dac trung tai day iD (chi dung du lieu den iD, tru nhom "3 phien sau day" dung den iD + 3)
export function dacTrung(b, iD, rsi) {
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const g = c[iD], dayL = l[iD];
  const d60 = hh(h, iD, 60); let i60 = iD; for (let j = iD - 59; j <= iD; j++) if (h[j] === d60) i60 = j;
  const tb20 = sma(v, iD - 1, 20);
  let vMax5 = 0; for (let j = iD - 2; j <= Math.min(iD + 2, b.length - 1); j++) vMax5 = Math.max(vMax5, v[j]);
  // phan ky: day thap nhat cua [iD-40, iD-8] so voi day hien tai
  let jT = -1, mT = Infinity; for (let j = iD - 40; j <= iD - 8; j++) if (l[j] < mT) { mT = l[j]; jT = j; }
  const phanKy = jT >= 0 && dayL < mT && rsi[iD] != null && rsi[jT] != null && rsi[iD] > rsi[jT];
  let tong = 0, treo = 0; for (let q = iD - 119; q <= iD; q++) { const gg = (h[q] + l[q] + c[q]) / 3; tong += v[q] || 0; if (gg >= 1.05 * g) treo += v[q] || 0; }
  const vi = vIdx.get(b[iD].t);
  const giamV = vi != null ? (1 - vni[vi].c / hh(vni.map((x) => x.h), vi, 20)) * 100 : null;
  const giam20 = (1 - g / hh(h, iD, 20)) * 100;
  const k3 = Math.min(iD + 3, b.length - 1);
  let vTang = 0, nTang = 0; for (let j = iD + 1; j <= k3; j++) if (c[j] > c[j - 1]) { vTang += v[j]; nTang++; }
  return {
    giam250: (1 - g / hh(h, iD, 250)) * 100, giam20, nenGiam: iD - i60,
    klDay: tb20 > 0 ? v[iD] / tb20 : null, klMax5: tb20 > 0 ? vMax5 / tb20 : null, rsiDay: rsi[iD], phanKy: phanKy ? 1 : 0,
    treo: tong > 0 ? (treo / tong) * 100 : null, soMA200: iD >= 200 ? (g / sma(c, iD, 200) - 1) * 100 : null, soMA50: (g / sma(c, iD, 50) - 1) * 100,
    rsTuongDoi: giamV != null ? giam20 - giamV : null,
    hoi3: (c[k3] / dayL - 1) * 100, klTang3: nTang && tb20 > 0 ? vTang / nTang / tb20 : 0,
  };
}

const nhom = (...t) => new Set(t.flatMap((k) => [...(NGANH.get(k) ?? [])]));
const NG = { THEP: nhom("Thep"), BDS: nhom("Bat dong san", "BDS Khu cong nghiep"), CK: nhom("Chung khoan") };
const iVniDay = (() => { const a = vni.slice(-45); let m = Infinity, k = 0; a.forEach((x, i) => { if (x.l < m) { m = x.l; k = i; } }); return a[k].t; })();
const hang = [];
for (const [ng, tap] of Object.entries(NG)) for (const ma of tap) {
  const b = cache[ma]; if (!b || b.length < 260) continue;
  const n = b.length, c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  let gt = 0; for (let j = n - 20; j < n; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
  let iD = n - 1, m = Infinity; for (let j = n - 45; j < n; j++) if (l[j] < m) { m = l[j]; iD = j; }
  if (n - 1 - iD < 3) { hang.push({ ma, ng, ngayDay: b[iD].t, moi: true }); continue; }
  const rsi = rsiArr(c);
  const dinhSau = hh(h, n - 1, n - 1 - iD);
  hang.push({ ma, ng, ngayDay: b[iD].t, hoiMax: (dinhSau / m - 1) * 100, hoiNay: (c[n - 1] / m - 1) * 100, ...dacTrung(b, iD, rsi) });
}
console.log(`VN-Index: day thap nhat 45 phien ngay ${iVniDay}, hien ${vni[vni.length - 1].c} (${vni[vni.length - 1].t})\n`);
const COT = [["giam250", "giam tu dinh 250p %"], ["giam20", "giam tu dinh 20p %"], ["nenGiam", "so phien tu dinh 60p"], ["klDay", "KL phien day / TB20"], ["klMax5", "KL max 5p quanh day / TB20"], ["rsiDay", "RSI tai day"], ["phanKy", "phan ky RSI"], ["treo", "KL treo tren dau %"], ["soMA200", "gia day so MA200 %"], ["soMA50", "gia day so MA50 %"], ["rsTuongDoi", "giam 20p - VNI giam 20p"], ["hoi3", "hoi 3 phien sau day %"], ["klTang3", "KL phien tang (3p sau day) / TB20"]];
const ds = hang.filter((x) => !x.moi).sort((p, q) => q.hoiMax - p.hoiMax);
console.log(`${"Ma".padEnd(5)} ${"Nganh".padEnd(5)} ${"Day".padEnd(6)} ${"hoiMax".padStart(6)} ${"hoiNay".padStart(6)} | ${COT.map(([k]) => k.padStart(7)).join(" ")}`);
for (const x of ds) console.log(`${x.ma.padEnd(5)} ${x.ng.padEnd(5)} ${x.ngayDay.slice(5).padEnd(6)} ${f(x.hoiMax).padStart(6)} ${f(x.hoiNay).padStart(6)} | ${COT.map(([k]) => f(x[k], k === "klDay" || k === "klMax5" || k === "klTang3" ? 2 : 1).padStart(7)).join(" ")}`);
const moi = hang.filter((x) => x.moi); if (moi.length) console.log(`\nChua co nhip hoi (day trong 3 phien cuoi): ${moi.map((x) => x.ma).join(", ")}`);
// Tuong quan hang Spearman voi muc hoi max
const rank = (a) => { const s = a.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); s.forEach(([, i], k) => (r[i] = k)); return r; };
const sp = (x, y) => { const ok = x.map((v, i) => v != null && y[i] != null && Number.isFinite(v)); const a = x.filter((_, i) => ok[i]), b = y.filter((_, i) => ok[i]); const ra = rank(a), rb = rank(b), n = a.length; const ma = tb(ra), mb = tb(rb); let s1 = 0, s2 = 0, s3 = 0; for (let i = 0; i < n; i++) { s1 += (ra[i] - ma) * (rb[i] - mb); s2 += (ra[i] - ma) ** 2; s3 += (rb[i] - mb) ** 2; } return { r: s1 / Math.sqrt(s2 * s3), n }; };
function tb(a) { return a.reduce((s, x) => s + x, 0) / a.length; }
console.log(`\nTuong quan Spearman voi MUC HOI MAX tu day (${ds.length} ma; |r| > 0,3 moi dang chu y voi mau nho nay):`);
for (const [k, ten] of COT) { const s = sp(ds.map((x) => x[k]), ds.map((x) => x.hoiMax)); console.log(`  ${ten.padEnd(34)} r = ${f(s.r, 2).padStart(5)} (n ${s.n})`); }
// ngay day so voi VN-Index
const truoc = ds.filter((x) => x.ngayDay < iVniDay).length;
console.log(`\n${truoc}/${ds.length} ma tao day TRUOC VN-Index (${iVniDay}); muc hoi TB nhom day truoc ${f(tb(ds.filter((x) => x.ngayDay < iVniDay).map((x) => x.hoiMax)))}% vs nhom day cung/sau ${f(tb(ds.filter((x) => x.ngayDay >= iVniDay).map((x) => x.hoiMax)))}%`);
