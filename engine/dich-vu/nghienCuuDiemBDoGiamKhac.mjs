// CACH DO "GIAM NHIEU" KHAC (Hieu 2026-10-21: "co cach nao do do giam nhieu cua ma khac ko"). Ngoai % giam tu dinh 20 phien (cach dang dung), thu 9 thuoc do tai diem B va chia TU PHAN VI (Q1 thap nhat ... Q4 cao nhat):
//  M1 giam tu dinh 20 phien (doi chieu)         M2 giam rong: day so voi gia dong cua 20 phien truoc nen day (muc co dinh theo thoi gian)
//  M3 giam tuong doi VN-Index: M1 cua ma tru M1 cua VN-Index (cung cua so)       M4 cach MA50: day thap hon MA50 bao nhieu %   M5 cach MA200 (chi ma du 200 phien)
//  M6 RSI14 thap nhat 20 phien (qua ban sau den dau - chuyen thanh -RSI de Q4 = qua ban nhat)  M7 so nen dong cua duoi dai Bollinger(20,2) trong 20 phien
//  M8 dot bien khoi luong: KL lon nhat 20 phien / KL TB 20 phien truoc do (bán thao dong loat)       M9 ty le phien giam trong 20 phien
// Nen goc: diem B (dong cua tren Tenkan 9 va Kijun 17, day 20 phien cach >= 3 phien, GTGD TB20 >= 3 ty) co boi canh da giam >= 8% tu dinh 20 phien trong 11 nen gan nhat, cach nhau >= 15 nen. Mua MO CUA phien sau, phi 0,4%.
// Do: thung day 20 phien sau, lai 10 / 20 phien (TB, ty le thang). Chia toan bo / tu 2022-05. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBDoGiamKhac.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vniBars = docJson("vnindex_dai.json");
const vni = new Map(vniBars.map((x, i) => [x.t, i]));
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const sma = (a, i, n) => { let s = 0; for (let j = i - n + 1; j <= i; j++) s += a[j]; return s / n; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);
const CP = 0.4;
const vc = vniBars.map((x) => x.c), vh = vniBars.map((x) => x.h);

function rsiSeries(c) {
  const o = new Array(c.length).fill(null); let ag = 0, al = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i <= 14) { ag += g / 14; al += l / 14; } else { ag = (ag * 13 + g) / 14; al = (al * 13 + l) / 14; }
    if (i >= 14) o[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return o;
}
const TEN = {
  M1: "giam tu dinh 20 phien", M2: "giam rong (day vs gia 20 phien truoc day)", M3: "giam tuong doi VN-Index", M4: "cach MA50", M5: "cach MA200",
  M6: "RSI14 thap nhat (qua ban)", M7: "so nen duoi dai Bollinger", M8: "dot bien KL (ban thao)", M9: "ty le phien giam / 20",
};
const ev = [];
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 260) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const rsi = rsiSeries(c);
  let ult = -99;
  for (let i = 230; i < n - 21; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6;
    if (gt / 20 < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 8) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (!(c[i] > tk && c[i] > kj && i - kDay >= 3 && i - ult >= 15)) continue;
    ult = i;
    const vi = vni.get(b[i].t); if (vi == null || vi < 40) continue;
    let giamV = 0; for (let k = 0; k <= 10; k++) giamV = Math.max(giamV, (1 - vc[vi - k] / hh(vh, vi - k, 20)) * 100);
    const E2 = o[i + 1]; let m20 = Infinity; for (let j = i + 1; j <= i + 20; j++) m20 = Math.min(m20, l[j]);
    let duoiBB = 0, giamN = 0, volMax = 0;
    for (let j = i - 19; j <= i; j++) {
      const m = sma(c, j, 20); let s = 0; for (let q = j - 19; q <= j; q++) s += (c[q] - m) ** 2;
      if (c[j] < m - 2 * Math.sqrt(s / 20)) duoiBB++;
      if (c[j] < c[j - 1]) giamN++;
      if (v[j] > volMax) volMax = v[j];
    }
    let rsiMin = 100; for (let j = i - 19; j <= i; j++) if (rsi[j] != null && rsi[j] < rsiMin) rsiMin = rsi[j];
    const vTruoc = sma(v, i - 20, 20);
    ev.push({
      ky: b[i].t < "2022-05-01" ? 0 : 1, thung: m20 < day,
      r10: (c[i + 11] / E2 - 1) * 100 - CP, r20: (c[i + 21] / E2 - 1) * 100 - CP,
      M1: giam, M2: (1 - day / c[Math.max(0, kDay - 20)]) * 100, M3: giam - giamV, M4: (1 - day / sma(c, kDay, 50)) * 100,
      M5: n > 220 && kDay >= 200 ? (1 - day / sma(c, kDay, 200)) * 100 : null, M6: -rsiMin, M7: duoiBB, M8: vTruoc > 0 ? volMax / vTruoc : null, M9: giamN / 20,
    });
  }
}
console.log(`${ev.length} diem B nen goc (boi canh giam >= 8%), tu 2022-05: ${ev.filter((x) => x.ky === 1).length}\n`);
const dong = (ten, a) => a.length < 25
  ? console.log(`    ${ten.padEnd(24)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`    ${ten.padEnd(24)} n=${String(a.length).padStart(5)} | thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0).padStart(3)}% | 10p ${f(tb(a.map((x) => x.r10)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r10)), 0)}%) | 20p ${f(tb(a.map((x) => x.r20)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r20)), 0)}%)`);
const tuPhanVi = (a, k) => {
  const g = a.filter((x) => x[k] != null).map((x) => x[k]).sort((p, q) => p - q);
  return [0.25, 0.5, 0.75].map((p) => g[Math.floor(g.length * p)]);
};
for (const k of Object.keys(TEN)) {
  const pv = tuPhanVi(ev, k);
  console.log(`== ${k} ${TEN[k]}  (phan vi 25/50/75: ${pv.map((x) => f(x, 1)).join(" / ")})`);
  for (const [tk, loc] of [["toan bo", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
    console.log(`   - ${tk}`);
    const a = ev.filter((x) => loc(x) && x[k] != null);
    dong("Q1 (thap nhat)", a.filter((x) => x[k] < pv[0]));
    dong("Q2", a.filter((x) => x[k] >= pv[0] && x[k] < pv[1]));
    dong("Q3", a.filter((x) => x[k] >= pv[1] && x[k] < pv[2]));
    dong("Q4 (cao nhat)", a.filter((x) => x[k] >= pv[2]));
  }
}

// ---- KET HOP: do giam sau (M1 >= 20% / M4 >= 15% / RSI <= 30) tach theo vi tri so voi MA200 (M5 >= 0: con tren MA200) ----
console.log("\n######## KET HOP voi MA200 ########");
const co200 = (x) => x.M5 != null;
for (const [ten, sau] of [["M1 giam >= 20% tu dinh 20p", (x) => x.M1 >= 20], ["M4 day thap hon MA50 >= 15%", (x) => x.M4 >= 15], ["M6 RSI14 thap nhat <= 30", (x) => x.M6 >= -30]]) {
  console.log(`== ${ten}`);
  for (const [tk, loc] of [["toan bo", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
    console.log(`   - ${tk}`);
    const a = ev.filter((x) => loc(x) && co200(x) && sau(x));
    dong("tren MA200 (M5 >= 0)", a.filter((x) => x.M5 >= 0));
    dong("0 > M5 >= -10 (sat MA200)", a.filter((x) => x.M5 < 0 && x.M5 >= -10));
    dong("duoi MA200 > 10%", a.filter((x) => x.M5 < -10));
  }
}
