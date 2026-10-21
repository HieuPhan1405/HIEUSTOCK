// DO DIEM DAO CHIEU TANG (Hieu 2026-10-21: "co cach nao do diem dao chieu tang hay khong"). Tap mau: moi 3 phien, co phieu da GIAM SAU (dong cua <= 85% dinh 20 phien), GTGD TB20 >= 5 ty.
// Nhan: lai 10 phien sau (dong cua t -> dong cua t+10, tru phi 0,4%) va "THANG" = cham +6% truoc -6% trong t+2..t+10 (hang ve T+2). Dac trung (NHAN QUA, chi dung du lieu den het phien t):
//  RSI14, RSI dang len (RSI - RSI 3 phien truoc), KL hom nay / TB20, cao trao KL (max KL/TB20 5 phien >= 2,5), gia > Tenkan, gia > Kijun, Tenkan > Kijun, so phien tu day 20 phien, % hoi tu day 20 phien,
//  vi tri dong cua trong bien do ngay, DAY CAO HON (day hom nay > day thap nhat 10 phien truoc), KL treo tren dau (%), nganh tren MA50, do rong nganh, VN-Index tren MA20, VN-Index hoi 5 phien, ATR%.
// Moi dac trung: chia 4 nhom, lai TB nhom thap nhat / cao nhat, chenh Q4-Q1 (t-stat), ty le THANG, va co dung CHIEU o ca 3 giai doan khong. Cuoi cung: ghep 3 dac trung tot nhat TREN GIAI DOAN DAU (< 2022.5), kiem tren 2022.5+ (ngoai mau).
// CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemDaoChieu.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH, nganhCuaMa } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const ngay = vni.map((b) => b.t);
const viTri = new Map(ngay.map((d, i) => [d, i]));
const N = ngay.length;
const sma = (a, n) => a.map((_, i) => (i >= n - 1 ? a.slice(i - n + 1, i + 1).reduce((s, x) => s + x, 0) / n : null));
const vc = vni.map((b) => b.c), vMA20 = sma(vc, 20);

// chi so nganh (nhu nghienCuuNganhLenh.mjs)
const TT = {};
for (const [ten, tap] of NGANH) {
  const ma = [...tap].filter((m) => cache[m] && cache[m].length > 300);
  if (ma.length < 6) continue;
  const ret = Array.from({ length: N }, () => ({ s: 0, n: 0, t20: 0, n20: 0 }));
  for (const m of ma) {
    const b = cache[m], c = b.map((x) => x.c), v = b.map((x) => x.v), s20 = sma(c, 20);
    for (let k = 21; k < b.length; k++) {
      const i = viTri.get(b[k].t);
      if (i == null) continue;
      let gt = 0;
      for (let j = k - 19; j <= k; j++) gt += (c[j] * v[j]) / 1e6;
      if (gt / 20 < 3) continue;
      const r = c[k] / c[k - 1] - 1;
      if (Math.abs(r) > 0.15) continue;
      ret[i].s += r; ret[i].n++;
      if (s20[k] != null) { ret[i].n20++; if (c[k] > s20[k]) ret[i].t20++; }
    }
  }
  const I = new Array(N).fill(null), rong = new Array(N).fill(null);
  let cur = 100, bd = false;
  for (let i = 0; i < N; i++) {
    if (ret[i].n >= Math.min(5, ma.length - 1)) { cur *= 1 + ret[i].s / ret[i].n; bd = true; rong[i] = ret[i].n20 ? ret[i].t20 / ret[i].n20 : null; }
    I[i] = bd ? cur : null;
  }
  TT[ten] = { I, MA50: sma(I.map((x) => x ?? 0), 50), rong };
}

const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };
function rsi14(c) {
  const o = new Array(c.length).fill(null); let ag = 0, al = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i <= 14) { ag += g / 14; al += l / 14; } else { ag = (ag * 13 + g) / 14; al = (al * 13 + l) / 14; }
    if (i >= 14) o[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return o;
}
const FEAT = [
  "RSI14", "RSI dang len (3 phien)", "KL hom nay / TB20", "Cao trao KL 5 phien (max KL/TB20)", "Gia > Tenkan", "Gia > Kijun", "Tenkan > Kijun",
  "So phien tu day 20 phien", "% hoi tu day 20 phien", "Vi tri dong cua trong bien do (0-100)", "Day cao hon day 10 phien truoc", "KL treo tren dau (%)",
  "Nganh tren MA50", "Do rong nganh (% ma tren MA20)", "VN-Index tren MA20", "VN-Index hoi 5 phien (%)", "ATR14 / gia (%)",
];
const MAU = [];
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), d = b.map((x) => x.t);
  const r = rsi14(c);
  const ng = nganhCuaMa(ma), T = ng ? TT[ng] : null;
  const ATR = new Array(n).fill(null); { let a = 0; for (let i = 1; i < n; i++) { const tr = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); a = i <= 14 ? a + tr / 14 : (a * 13 + tr) / 14; if (i >= 14) ATR[i] = a; } }
  const rel = new Array(n).fill(null);
  for (let i = 21; i < n; i++) { let s = 0; for (let j = i - 20; j < i; j++) s += v[j]; s /= 20; rel[i] = s > 0 ? v[i] / s : null; }
  for (let t = 130 + (ma.charCodeAt(0) % 3); t < n - 11; t += 3) {
    if (!(c[t] <= 0.85 * hh(h, t, 20))) continue;
    let gt = 0; for (let j = t - 19; j <= t; j++) gt += (c[j] * v[j]) / 1e6;
    if (gt / 20 < 5 || r[t] == null || r[t - 3] == null || rel[t] == null) continue;
    const i = viTri.get(d[t]); if (i == null || i < 60) continue;
    const tenkan = (hh(h, t, 9) + ll(l, t, 9)) / 2, kijun = (hh(h, t, 17) + ll(l, t, 17)) / 2;
    const day20 = ll(l, t, 20); let kDay = t; for (let j = t - 19; j <= t; j++) if (l[j] <= day20) kDay = j;
    let capt = 0; for (let j = t - 4; j <= t; j++) if (rel[j] != null && rel[j] > capt) capt = rel[j];
    let tong = 0, treo = 0;
    for (let j = t - 119; j <= t; j++) { const g = (h[j] + l[j] + c[j]) / 3; tong += v[j] || 0; if (g >= 1.05 * c[t]) treo += v[j] || 0; }
    const rng = h[t] - l[t];
    // nhan
    const y10 = (c[t + 10] / c[t] - 1) * 100 - 0.4;
    let thang = null;
    for (let j = t + 2; j <= t + 10; j++) { if (l[j] <= c[t] * 0.94) { thang = 0; break; } if (h[j] >= c[t] * 1.06) { thang = 1; break; } }
    const ix = T && T.I[i] != null ? T : null;
    const f = [
      r[t], r[t] - r[t - 3], rel[t], capt, c[t] > tenkan ? 1 : 0, c[t] > kijun ? 1 : 0, tenkan > kijun ? 1 : 0,
      t - kDay, (c[t] / day20 - 1) * 100, rng > 0 ? ((c[t] - l[t]) / rng) * 100 : 50, l[t] > ll(l, t - 1, 10) ? 1 : 0, (treo / tong) * 100,
      ix ? (ix.I[i] > ix.MA50[i] ? 1 : 0) : null, ix ? ix.rong[i] : null, vMA20[i] != null ? (vc[i] > vMA20[i] ? 1 : 0) : null, (vc[i] / vc[i - 5] - 1) * 100, ATR[t] ? (ATR[t] / c[t]) * 100 : null,
    ];
    MAU.push({ f, y10, thang: thang ?? 0, ky: d[t] < "2019-01-01" ? 0 : d[t] < "2022-05-01" ? 1 : 2, ngay: d[t] });
  }
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length - 1, 1)); };
const ft = (x, d2 = 2) => (Number.isFinite(x) ? x.toFixed(d2) : "-");
console.log(`${MAU.length} mau (co phieu da giam >= 15% tu dinh 20 phien, moi 3 phien). Co so: lai 10 phien ${ft(tb(MAU.map((x) => x.y10)))}% | THANG (+6% truoc -6%) ${ft(tb(MAU.map((x) => x.thang)) * 100, 0)}%\n`);
const tStat = (a, b) => (tb(a) - tb(b)) / Math.sqrt(sd(a) ** 2 / a.length + sd(b) ** 2 / b.length);
const KQ = [];
for (let k = 0; k < FEAT.length; k++) {
  const ok = MAU.filter((x) => x.f[k] != null);
  const nhiNguyen = new Set(ok.map((x) => x.f[k])).size <= 2;
  let nhom;
  if (nhiNguyen) nhom = [ok.filter((x) => x.f[k] === 0), ok.filter((x) => x.f[k] === 1)];
  else { const s = [...ok].sort((p, q) => p.f[k] - q.f[k]); const q4 = Math.floor(s.length / 4); nhom = [s.slice(0, q4), s.slice(3 * q4)]; }
  if (nhom[0].length < 50 || nhom[1].length < 50) continue;
  const lo = nhom[0].map((x) => x.y10), hi = nhom[1].map((x) => x.y10);
  const t = tStat(hi, lo);
  const theoKy = [0, 1, 2].map((j) => tb(nhom[1].filter((x) => x.ky === j).map((x) => x.y10)) - tb(nhom[0].filter((x) => x.ky === j).map((x) => x.y10)));
  const cungChieu = theoKy.every((d) => Math.sign(d) === Math.sign(t));
  KQ.push({ k, ten: FEAT[k], nhiNguyen, lo: tb(lo), hi: tb(hi), tw0: tb(nhom[0].map((x) => x.thang)) * 100, tw1: tb(nhom[1].map((x) => x.thang)) * 100, t, theoKy, cungChieu, n0: nhom[0].length, n1: nhom[1].length });
}
KQ.sort((a, b) => Math.abs(b.t) - Math.abs(a.t));
console.log(`${"Dac trung (nhom cao = Q4 hoac =1; thap = Q1 hoac =0)".padEnd(52)} ${"lai thap".padStart(8)} ${"lai cao".padStart(8)} ${"thang thap".padStart(10)} ${"thang cao".padStart(9)} ${"t".padStart(5)} | chenh theo 3 giai doan (cao - thap) | dung chieu 3 gd`);
for (const r of KQ) console.log(`${r.ten.padEnd(52)} ${ft(r.lo).padStart(7)}% ${ft(r.hi).padStart(7)}% ${ft(r.tw0, 0).padStart(9)}% ${ft(r.tw1, 0).padStart(8)}% ${ft(r.t, 1).padStart(5)} | ${r.theoKy.map((x) => ft(x).padStart(6)).join(" ")} | ${r.cungChieu ? "CO" : "khong"}`);

// ghep 3 dac trung tot nhat TREN GIAI DOAN DAU (< 2022.5), kiem ngoai mau 2022.5+
const dau = MAU.filter((x) => x.ky < 2), moi = MAU.filter((x) => x.ky === 2);
const huong = {};
const xepDau = [];
for (let k = 0; k < FEAT.length; k++) {
  const ok = dau.filter((x) => x.f[k] != null);
  if (ok.length < 200) continue;
  const med = [...ok.map((x) => x.f[k])].sort((p, q) => p - q)[Math.floor(ok.length / 2)];
  const cao = ok.filter((x) => x.f[k] > med), thap = ok.filter((x) => x.f[k] <= med);
  if (cao.length < 50 || thap.length < 50) continue;
  const t = tStat(cao.map((x) => x.y10), thap.map((x) => x.y10));
  xepDau.push({ k, med, t });
}
xepDau.sort((a, b) => Math.abs(b.t) - Math.abs(a.t));
const top = xepDau.slice(0, 3);
console.log(`\n=== GHEP 3 DAC TRUNG TOT NHAT TREN GIAI DOAN DAU (< 2022.5): ${top.map((x) => `${FEAT[x.k]} ${x.t > 0 ? ">" : "<="} ${ft(x.med)} (t ${ft(x.t, 1)})`).join("; ")} ===`);
const diem = (x) => top.reduce((s, q) => s + (x.f[q.k] != null && ((x.f[q.k] > q.med) === (q.t > 0)) ? 1 : 0), 0);
for (const [ten, tap] of [["Giai doan DAU (trong mau)", dau], ["2022.5+ (NGOAI MAU)", moi]]) {
  console.log(`  ${ten}: n=${tap.length}`);
  for (const s of [0, 1, 2, 3]) {
    const a = tap.filter((x) => diem(x) === s);
    console.log(`     du ${s}/3 dieu kien: n=${String(a.length).padStart(5)} lai 10 phien ${ft(tb(a.map((x) => x.y10))).padStart(6)}%  THANG ${ft(tb(a.map((x) => x.thang)) * 100, 0)}%`);
  }
}

// ---- QUY TAC "DAO CHIEU DA XAC NHAN" cu the ----
console.log("\n=== QUY TAC CU THE (trong tap co phieu da giam >= 15%): lai 10 phien sau phi / THANG / n; chia 3 giai doan ===");
const R = (ten, fn) => {
  const a = MAU.filter(fn);
  const kyS = [0, 1, 2].map((j) => { const z = a.filter((x) => x.ky === j); return `${ft(tb(z.map((x) => x.y10)))}% (${z.length})`; });
  console.log(`  ${ten.padEnd(66)} n=${String(a.length).padStart(5)} lai ${ft(tb(a.map((x) => x.y10))).padStart(6)}% THANG ${ft(tb(a.map((x) => x.thang)) * 100, 0)}% | ${kyS.join(" | ")}`);
};
const F = (x, k) => x.f[k];
R("Tat ca (co so)", () => true);
R("Gia > Tenkan va > Kijun", (x) => F(x, 4) === 1 && F(x, 5) === 1);
R("  + day 20 phien cach >= 3 phien", (x) => F(x, 4) === 1 && F(x, 5) === 1 && F(x, 7) >= 3);
R("  + RSI dang len (>= +3 diem / 3 phien)", (x) => F(x, 4) === 1 && F(x, 5) === 1 && F(x, 7) >= 3 && F(x, 1) >= 3);
R("  + VN-Index DUOI MA20 (ca thi truong yeu)", (x) => F(x, 4) === 1 && F(x, 5) === 1 && F(x, 7) >= 3 && F(x, 14) === 0);
R("  + VN-Index TREN MA20", (x) => F(x, 4) === 1 && F(x, 5) === 1 && F(x, 7) >= 3 && F(x, 14) === 1);
R("Gia <= Tenkan (chua xac nhan)", (x) => F(x, 4) === 0);
R("Dang o day (day 20 phien <= 2 phien truoc), gia <= Tenkan", (x) => F(x, 7) <= 2 && F(x, 4) === 0);
R("Dang o day 20 phien + RSI < 30 (bat day som)", (x) => F(x, 7) <= 2 && F(x, 0) < 30);
R("VN-Index DUOI MA20 (thi truong yeu, ma giam sau)", (x) => F(x, 14) === 0);
R("VN-Index TREN MA20 (ma yeu rieng)", (x) => F(x, 14) === 1);
