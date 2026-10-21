// BACKTEST MAU HINH NEN NHAT (lib/mauHinhNen.js) tren ~390 ma, nen ngay. Moi lan mau hinh hoan thanh tai nen dong cua i -> VAO MO CUA PHIEN SAU, do lai 5 / 10 phien (phi 0,4%), THEO HUONG mau hinh (mau hinh giam: duong = gia giam, khong tru phi).
// So sanh voi co so (moi phien, moi ma, cung dieu kien GTGD TB20 >= 3 ty) va chia: toan bo / tu 2022-05 / RIENG TAI VUNG DAY (gia dong cua <= 85% dinh 20 phien truoc do - bat day) cho mau hinh TANG, tai vung dinh (>= 115% day 20 phien) cho mau hinh GIAM.
// Mot ma chi tinh 1 lan / mau hinh / 5 nen. Ket qua dung de dien THONG_KE_MAU_HINH_NEN (tham khao). CHI DOC cache. CACH CHAY: node engine/dich-vu/backtestMauHinhNen.mjs
import { docJson } from "./backtestChung.mjs";
import { nhanDienMauHinhNen, MAU_HINH_NEN } from "../../lib/mauHinhNen.js";

const cache = docJson("nen_dai.json");
const CP = 0.4;
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };

const ev = Object.fromEntries(MAU_HINH_NEN.map((m) => [m.khoa, []])); ev.CO_SO = [];
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  const gt = []; let g = 0; for (let i = 0; i < n; i++) { g += (c[i] * v[i]) / 1e6; if (i >= 20) g -= (c[i - 20] * v[i - 20]) / 1e6; gt.push(i >= 19 ? g / 20 : 0); }
  const ghi = (i, huong) => {
    const E = o[i + 1];
    const r = (k) => (c[i + 1 + k] ? (huong >= 0 ? (c[i + 1 + k] / E - 1) * 100 - CP : -((c[i + 1 + k] / E - 1) * 100)) : null);
    return { ky: t[i] < "2022-05-01" ? 0 : 1, r5: r(5), r10: r(10), day: c[i] <= 0.85 * hh(h, i, 20), dinh: c[i] >= 1.15 * ll(l, i, 20) };
  };
  for (let i = 30; i < n - 12; i++) if (gt[i] >= 3 && i % 5 === 0) { const x = ghi(i, 1); ev.CO_SO.push({ ...x, huong: 1 }); }
  const ult = {};
  // nhan dien tren toan chuoi 1 lan (tuoiToiDa = null -> toan bo tu nen 20)
  for (const m of nhanDienMauHinhNen(b)) {
    const i = m.i; if (i >= n - 12 || gt[i] < 3 || i - (ult[m.khoa] ?? -99) < 5) continue; ult[m.khoa] = i;
    ev[m.khoa].push({ ...ghi(i, m.huong), huong: m.huong });
  }
}
// co so theo huong giam = doi dau lai co so tang (khong tru phi): luu cung 1 mang, tinh rieng
const csGiam = ev.CO_SO.map((x) => ({ ...x, r5: x.r5 == null ? null : -(x.r5 + CP), r10: x.r10 == null ? null : -(x.r10 + CP), huong: -1 }));
const kq = {};
const dong = (ten, a, cs) => {
  const r5 = a.map((x) => x.r5).filter((x) => x != null), r10 = a.map((x) => x.r10).filter((x) => x != null);
  const c5 = cs.map((x) => x.r5).filter((x) => x != null), c10 = cs.map((x) => x.r10).filter((x) => x != null);
  console.log(`   ${ten.padEnd(24)} n=${String(a.length).padStart(5)} | 5p ${f(tb(r5)).padStart(5)} [${f(th(r5), 0)}%] (co so ${f(tb(c5))}) | 10p ${f(tb(r10)).padStart(5)} [${f(th(r10), 0)}%] (co so ${f(tb(c10))})`);
  return { n: a.length, r5: tb(r5), r10: tb(r10), w10: th(r10), cs10: tb(c10) };
};
for (const [tk, loc] of [["TOAN BO (2014-2026)", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
  console.log(`\n######## ${tk} (lai THEO HUONG mau hinh; tang: da tru phi 0,4%) ########`);
  for (const m of MAU_HINH_NEN) {
    const a = ev[m.khoa].filter(loc), cs = (m.huong >= 0 ? ev.CO_SO : csGiam).filter(loc);
    const x = dong(`${m.ten}${m.huong > 0 ? " ▲" : m.huong < 0 ? " ▼" : ""}`, a, cs);
    if (tk.startsWith("TOAN")) kq[m.khoa] = { n: x.n, r5: Number(f(x.r5)), r10: Number(f(x.r10)), w10: Number(f(x.w10, 0)), cs10: Number(f(x.cs10)) };
  }
}
console.log("\n######## RIENG VUNG DAY (tang) / VUNG DINH (giam), toan bo ########");
for (const m of MAU_HINH_NEN) {
  if (m.huong === 0) continue;
  const a = ev[m.khoa].filter((x) => (m.huong > 0 ? x.day : x.dinh)), cs = (m.huong > 0 ? ev.CO_SO : csGiam).filter((x) => (m.huong > 0 ? x.day : x.dinh));
  dong(`${m.ten}${m.huong > 0 ? " ▲ @day" : " ▼ @dinh"}`, a, cs);
}
console.log("\nTHONG_KE_MAU_HINH_NEN (toan bo):\n" + JSON.stringify(kq));
