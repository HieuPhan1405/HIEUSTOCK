// DIEM B THEO MUC GIAM TU DINH DAI HON (Hieu 2026-10-21: "dinh nhieu phien hon di, test them, vi may ma nay giam lau roi"; TCX giam 17,8% tu dinh 20 phien nhung da giam lau).
// Giong nghienCuuDiemBTheoMucGiam.mjs, nhung MUC GIAM do tu dinh (cao nhat) L phien truoc: L = 20 / 60 / 120 / 250. Diem B: dong cua tren Tenkan 9 va Kijun 17, day 20 phien cach >= 3 phien, GTGD TB20 >= 3 ty,
// moi nhip hoi 1 lan (cach nhau >= 15 phien, tinh tren moi diem B giam >= 10%). Muc giam = giam sau nhat tu dinh L phien trong 11 nen gan B. Mua MO CUA phien sau (thuc te), phi 0,4%.
// Cot: lai 10 / 20 phien (TB, ty le thang), thung day 20 phien, SL/TP quan ly (SL cau truc 3,5-6%, TP = dinh 60 nen neu cach >= 5% khong thi +10%, het han 20 phien). Chia: toan bo / tu 2022-05.
// CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBDinhDai.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4;
const NHOM = process.env.NHOM ? JSON.parse(process.env.NHOM) : [[10, 20], [20, 30], [30, 40], [40, 999]]; // doi nhom: NHOM='[[10,15],[15,18],[18,20],[20,25]]'
const DS_L = process.env.DS_L ? JSON.parse(process.env.DS_L) : [20, 60, 120, 250]; // doi dinh: DS_L='[20,40]'
const tenNhom = ([a, b]) => (b === 999 ? `>= ${a}%` : `${a}-${b}%`);

function atrWilder(h, l, c, n = 14) {
  const o = new Array(c.length).fill(null); let a = null;
  for (let i = n; i < c.length; i++) {
    const tr = (j) => Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1]));
    if (i === n) { let s = 0; for (let j = 1; j <= n; j++) s += tr(j); a = s / n; } else a = (a * (n - 1) + tr(i)) / n;
    o[i] = a;
  }
  return o;
}
const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);

const kq = {};
for (const L of DS_L) {
  const ev = [];
  for (const ma of Object.keys(cache)) {
    const b = cache[ma]; if (!b || b.length < 400) continue;
    const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
    const atr = atrWilder(h, l, c);
    let ult = -99;
    for (let i = 260; i < n - 21; i++) {
      let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6;
      if (gt / 20 < 3) continue;
      let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, L)) * 100);
      if (giam < 10) continue;
      const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
      const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
      if (!(c[i] > tk && c[i] > kj && i - kDay >= 3 && i - ult >= 15)) continue;
      ult = i;
      const E = c[i], E2 = o[i + 1];
      let m20 = Infinity; for (let j = i + 1; j <= i + 20; j++) m20 = Math.min(m20, l[j]);
      const a = atr[i] ?? E * 0.03;
      let sl = Math.min(kj - 0.5 * a, E * (1 - 0.035)); sl = Math.max(sl, E * (1 - 0.06));
      const d60 = hh(h, i, 60), tp = d60 >= E2 * 1.05 ? d60 : E2 * 1.1;
      let thoat = c[i + 21], lydo = "het";
      for (let j = i + 2; j <= i + 21; j++) {
        if (l[j] <= sl) { thoat = Math.min(sl, o[j]); lydo = "SL"; break; }
        if (h[j] >= tp) { thoat = Math.max(tp, o[j]); lydo = "TP"; break; }
      }
      ev.push({
        ky: b[i].t < "2022-05-01" ? 0 : 1, giam, cachDay: (E / day - 1) * 100, thung: m20 < day,
        r10: (c[i + 11] / E2 - 1) * 100 - CP, r20: (c[i + 21] / E2 - 1) * 100 - CP, rQL: (thoat / E2 - 1) * 100 - CP, lydo,
      });
    }
  }
  kq[L] = ev;
}
const dong = (ten, a) => {
  if (a.length < 25) { console.log(`  ${ten.padEnd(8)} n=${String(a.length).padStart(5)} (it mau)`); return; }
  console.log(
    `  ${ten.padEnd(8)} n=${String(a.length).padStart(5)} | thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0).padStart(3)}% cach day ${f(tb(a.map((x) => x.cachDay))).padStart(5)}%`
    + ` | 10p ${f(tb(a.map((x) => x.r10)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r10)), 0)}%) 20p ${f(tb(a.map((x) => x.r20)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r20)), 0)}%)`
    + ` | SL/TP/20p ${f(tb(a.map((x) => x.rQL)), 2).padStart(6)} (SL ${f((a.filter((x) => x.lydo === "SL").length / a.length) * 100, 0)}% TP ${f((a.filter((x) => x.lydo === "TP").length / a.length) * 100, 0)}%)`
  );
};
for (const L of DS_L) {
  console.log(`\n######## MUC GIAM TINH TU DINH ${L} PHIEN (${kq[L].length} diem B giam >= 10%) ########`);
  for (const [tenKy, loc] of [["toan bo", () => true], ["TRUOC 2022-05", (x) => x.ky === 0], ["TU 2022-05", (x) => x.ky === 1]]) {
    console.log(` -- ${tenKy}`);
    for (const g of NHOM) dong(tenNhom(g), kq[L].filter((x) => loc(x) && x.giam >= g[0] && x.giam < g[1]));
  }
}
