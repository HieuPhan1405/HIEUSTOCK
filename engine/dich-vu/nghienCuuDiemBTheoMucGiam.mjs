// HIEU QUA DIEM B THEO MUC GIAM (Hieu 2026-10-21: "test cac muc co phieu giam de xem hieu qua diem B").
// Diem B (engine/loi/diemMuaPhucHoi.js): dong cua tren Tenkan 9 va Kijun 17 sau khi giam sau, day 20 phien cach >= 3 phien, GTGD TB20 >= 3 ty, moi nhip hoi 1 lan (cach nhau >= 15 phien).
// Day phat hien dung nguong giam 10% (thap nhat de thay ca vung 10-15%), roi CHIA NHOM theo MUC GIAM THAT = giam sau nhat tu dinh 20 phien (tinh tai moi nen trong 11 nen gan B): 10-15 / 15-20 / 20-25 / 25-30 / >= 30%.
// Do: (1) vi tri B so voi day 20 phien (cach day %), ty le THUNG DAY trong 20 phien sau, SUT >= 5% trong 10 phien; (2) lai NEU MUA o dong cua B (ATC, khong thuc te vi B chi biet sau khi dong cua) va NEU MUA MO CUA PHIEN SAU (thuc te), sau 10 / 20 phien, phi 0,4%;
// (3) quan ly lenh: SL cau truc (Kijun - 0,5 ATR, cach gia >= 3,5%, toi da 6%) + thoat theo thoi gian 20 phien (hoac TP1 la dinh 60 nen neu cach >= 5%, chot toan bo) - mua mo cua phien sau; (4) doi chieu: khong dieu kien (moi phien, moi ma) cung thoi diem.
// Chia 2 giai doan: truoc / tu 2022-05. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBTheoMucGiam.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4;
const NHOM = [[10, 15], [15, 20], [20, 25], [25, 30], [30, 999]];
const tenNhom = ([a, b]) => (b === 999 ? `>= ${a}%` : `${a}-${b}%`);

function atrWilder(h, l, c, n = 14) {
  const o = new Array(c.length).fill(null); let a = null;
  for (let i = 1; i < c.length; i++) {
    const tr = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]));
    if (i < n) continue;
    a = i === n ? (() => { let s = 0; for (let j = 1; j <= n; j++) s += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])); return s / n; })() : (a * (n - 1) + tr) / n;
    o[i] = a;
  }
  return o;
}

const ev = [];
const co = []; // doi chieu: moi nen (du dieu kien thanh khoan), mua mo cua phien sau, giu 10 / 20
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 300) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const atr = atrWilder(h, l, c);
  const dinh60 = (i) => hh(h, i, 60);
  let ult = -99;
  for (let i = 130; i < n - 21; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6;
    if (gt / 20 < 3) continue;
    // doi chieu khong dieu kien (mua mo cua phien sau)
    if (i % 5 === 0) co.push({ r10: (c[i + 11] / o[i + 1] - 1) * 100 - CP, r20: (c[i + 21] / o[i + 1] - 1) * 100 - CP, ky: b[i].t < "2022-05-01" ? 0 : 1 });
    // muc giam sau nhat trong 11 nen gan nhat
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 10) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (!(c[i] > tk && c[i] > kj && i - kDay >= 3 && i - ult >= 15)) continue;
    ult = i;
    const E = c[i], E2 = o[i + 1];
    let m10 = Infinity, m20 = Infinity;
    for (let j = i + 1; j <= i + 10; j++) m10 = Math.min(m10, l[j]);
    for (let j = i + 1; j <= i + 20; j++) m20 = Math.min(m20, l[j]);
    // quan ly lenh (mua mo cua phien sau): SL cau truc, TP1 = dinh 60 nen neu cach >= 5% (chot het), thoi gian 20 phien
    const a = atr[i] ?? E * 0.03;
    let sl = Math.min(kj - 0.5 * a, E * (1 - 0.035)); sl = Math.max(sl, E * (1 - 0.06));
    const tp = dinh60(i) >= E2 * 1.05 ? dinh60(i) : E2 * 1.1;
    let thoat = c[i + 21], lydo = "het han";
    for (let j = i + 1; j <= i + 21; j++) {
      if (j > i + 1 && l[j] <= sl) { thoat = Math.min(sl, o[j]); lydo = "SL"; break; }
      if (j > i + 1 && h[j] >= tp) { thoat = Math.max(tp, o[j] > tp ? o[j] : tp); lydo = "TP"; break; }
    }
    ev.push({
      ma, ky: b[i].t < "2022-05-01" ? 0 : 1, giam, cachDay: (E / day - 1) * 100, thung: m20 < day, sut: m10 <= E * 0.95,
      rC10: (c[i + 10] / E - 1) * 100 - CP, rC20: (c[i + 20] / E - 1) * 100 - CP,
      rO10: (c[i + 11] / E2 - 1) * 100 - CP, rO20: (c[i + 21] / E2 - 1) * 100 - CP,
      rQL: (thoat / E2 - 1) * 100 - CP, lydo,
    });
  }
}
console.log(`${ev.length} diem B (nguong giam >= 10%), ${co.length} mau doi chieu (moi 5 phien, moi ma, mua mo cua phien sau)\n`);
console.log(`DOI CHIEU khong dieu kien: lai 10p ${f(tb(co.map((x) => x.r10)), 2)}% | 20p ${f(tb(co.map((x) => x.r20)), 2)}%  (truoc 2022.5: ${f(tb(co.filter((x) => x.ky === 0).map((x) => x.r10)), 2)} / ${f(tb(co.filter((x) => x.ky === 0).map((x) => x.r20)), 2)} ; tu 2022.5: ${f(tb(co.filter((x) => x.ky === 1).map((x) => x.r10)), 2)} / ${f(tb(co.filter((x) => x.ky === 1).map((x) => x.r20)), 2)})\n`);

const dong = (ten, a) => {
  if (a.length < 15) { console.log(`${ten.padEnd(14)} n=${String(a.length).padStart(5)} (it mau)`); return; }
  const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);
  console.log(
    `${ten.padEnd(14)} n=${String(a.length).padStart(5)} | cach day ${f(tb(a.map((x) => x.cachDay))).padStart(5)}% thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0).padStart(3)}% sut>=5% ${f((a.filter((x) => x.sut).length / a.length) * 100, 0).padStart(3)}%`
    + ` | MUA ATC B: 10p ${f(tb(a.map((x) => x.rC10)), 2).padStart(6)} 20p ${f(tb(a.map((x) => x.rC20)), 2).padStart(6)}`
    + ` | MUA MO CUA SAU: 10p ${f(tb(a.map((x) => x.rO10)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.rO10)), 0)}%) 20p ${f(tb(a.map((x) => x.rO20)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.rO20)), 0)}%)`
    + ` | QUAN LY SL/TP/20p: ${f(tb(a.map((x) => x.rQL)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.rQL)), 0)}%, SL ${f((a.filter((x) => x.lydo === "SL").length / a.length) * 100, 0)}% TP ${f((a.filter((x) => x.lydo === "TP").length / a.length) * 100, 0)}%)`
  );
};
for (const [tenKy, loc] of [["TOAN BO", () => true], ["TRUOC 2022-05", (x) => x.ky === 0], ["TU 2022-05", (x) => x.ky === 1]]) {
  console.log(`=== ${tenKy} ===`);
  for (const g of NHOM) dong(tenNhom(g), ev.filter((x) => loc(x) && x.giam >= g[0] && x.giam < g[1]));
  dong("tat ca >= 10%", ev.filter(loc));
  dong("tat ca >= 15%", ev.filter((x) => loc(x) && x.giam >= 15));
  console.log("");
}
