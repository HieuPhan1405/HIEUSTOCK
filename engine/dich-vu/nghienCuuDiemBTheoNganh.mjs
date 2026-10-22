// DIEM B + CA NGANH CUNG HOI (Hieu 2026-10-21: "hay la loc theo nganh, vi thi truong VN se phuc hoi ca nganh, kieu BDS").
// Moi diem B (giam >= 15% tu dinh 20 phien, dong cua tren Tenkan 9 + Kijun 17, day cach >= 3 phien, GTGD >= 3 ty, 1 lan / 15 phien) gan them dac trung NGANH tai ngay B (nganh gop: BDS KCN -> BDS):
//   NG_B2   : co it nhat 2 ma KHAC cung nganh co diem B trong 5 phien truoc / dung ngay B (ca nganh cung quay dau);
//   NG_B3   : it nhat 3 ma khac;     NG_B_PCT: ty le ma cung nganh (GTGD >= 3 ty) co diem B trong 5 phien >= 15%;
//   NG_TREN : >= 50% ma cung nganh dong cua tren Tenkan va Kijun tai ngay B (nganh da lay lai duong ngan han);
//   NG_DAO  : NG_TREN va 10 phien truoc ty le do tung <= 25% (nganh vua dao chieu tu day);
//   NG_MANH : ma co muc giam tu dinh 20 phien LON hon trung vi nganh va ca nganh deu giam (giam >= 10% trung vi) - ma o phan yeu nhat cua nganh vua giam.
// Do: lai 10 / 20 phien (mua MO CUA phien sau, phi 0,4%), co / khong, truoc 2022-05 / tu 2022-05 / 2026, on dinh theo nam (n >= 15 moi nhom); va them vao BO LOC KHUYEN NGHI (giam >= 20% + KL day >= 2x + thi truong yeu). CHI DOC cache.
// CACH CHAY: node engine/dich-vu/nghienCuuDiemBTheoNganh.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const CP = 0.4;
const NGANH_CUA = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!NGANH_CUA.has(m)) NGANH_CUA.set(m, ten === "BDS Khu cong nghiep" ? "Bat dong san" : ten);
const vIdx = new Map(vni.map((x, i) => [x.t, i])), vc = vni.map((x) => x.c);
const vSua = vni.map((_, i) => (i >= 59 ? (vc[i] / hh(vc, i, 60) - 1) * 100 : 0));
const lich = vni.map((x) => x.t), lichIdx = vIdx;

// ---- chuan bi tung ma ----
const SE = {};
const ngTren = {}; const ngTong = {}; // nganh -> Map(ngay -> dem)
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const ng = NGANH_CUA.get(ma); if (!ng) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  let g = 0; const gt = c.map((x, i) => { g += (x * v[i]) / 1e6; if (i >= 20) g -= (c[i - 20] * v[i - 20]) / 1e6; return i >= 19 ? g / 20 : 0; });
  const tk = c.map((_, i) => (i >= 8 ? (hh(h, i, 9) + ll(l, i, 9)) / 2 : null)), kj = c.map((_, i) => (i >= 16 ? (hh(h, i, 17) + ll(l, i, 17)) / 2 : null));
  SE[ma] = { n, c, h, l, v, o, t, gt, tk, kj, ng };
  const T = (ngTren[ng] ||= new Map()), N = (ngTong[ng] ||= new Map());
  for (let i = 40; i < n; i++) { if (gt[i] < 3) continue; N.set(t[i], (N.get(t[i]) ?? 0) + 1); if (c[i] > tk[i] && c[i] > kj[i]) T.set(t[i], (T.get(t[i]) ?? 0) + 1); }
}
// ---- diem B ----
const ev = [];
for (const [ma, s] of Object.entries(SE)) {
  const { n, c, h, l, v, o, t, gt, tk, kj, ng } = s;
  let ult = -99;
  for (let i = 270; i < n - 21; i++) {
    if (gt[i] < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 15 || !(c[i] > tk[i] && c[i] > kj[i])) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 3 || i - ult < 15) continue;
    ult = i;
    let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
    let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
    const vi = vIdx.get(t[i]); if (vi == null) continue;
    const E = o[i + 1];
    ev.push({ ma, ng, i, t: t[i], vi, nam: Number(t[i].slice(0, 4)), ky: t[i] < "2022-05-01" ? 0 : 1, giam, KL: tb20 > 0 && vMax >= 2 * tb20, VNI_YEU: vSua[vi] <= -7, r10: (c[i + 11] / E - 1) * 100 - CP, r20: (c[i + 21] / E - 1) * 100 - CP });
  }
}
// ---- dac trung nganh ----
const bTheoNganhNgay = {}; for (const e of ev) { const M = (bTheoNganhNgay[e.ng] ||= new Map()); (M.get(e.t) ?? M.set(e.t, []).get(e.t)).push(e); }
for (const e of ev) {
  const M = bTheoNganhNgay[e.ng]; let dem = 0;
  for (let q = e.vi - 5; q <= e.vi; q++) { const x = M.get(lich[q]) ?? []; dem += x.filter((y) => y.ma !== e.ma).length; }
  const tong = ngTong[e.ng]?.get(e.t) ?? 0, tren = ngTren[e.ng]?.get(e.t) ?? 0;
  e.NG_B1 = dem >= 1; e.NG_B2 = dem >= 2; e.NG_B3 = dem >= 3; e.NG_B_PCT = tong >= 4 && (dem + 1) / tong >= 0.15;
  e.NG_TREN = tong >= 4 && tren / tong >= 0.5;
  let min10 = 1; for (let q = e.vi - 10; q < e.vi; q++) { const tt = ngTong[e.ng]?.get(lich[q]) ?? 0; if (tt >= 4) min10 = Math.min(min10, (ngTren[e.ng]?.get(lich[q]) ?? 0) / tt); }
  e.NG_DAO = e.NG_TREN && min10 <= 0.25;
}
// NG_MANH: muc giam cua ma > trung vi muc giam cac ma B cung nganh trong +-5 phien va trung vi nganh >= 10%
for (const e of ev) {
  const M = bTheoNganhNgay[e.ng]; const g = [];
  for (let q = e.vi - 5; q <= e.vi + 0; q++) for (const y of M.get(lich[q]) ?? []) g.push(y.giam);
  e.NG_MANH = g.length >= 3 && med(g) >= 10 && e.giam > med(g);
}
const FE = ["NG_B1", "NG_B2", "NG_B3", "NG_B_PCT", "NG_TREN", "NG_DAO", "NG_MANH"];
const dong = (ten, a) => (a.length < 25
  ? console.log(`     ${ten.padEnd(30)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`     ${ten.padEnd(30)} n=${String(a.length).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10))).padStart(6)} [${f(th(a.map((x) => x.r10)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20))).padStart(6)} [${f(th(a.map((x) => x.r20)), 0)}%]`));
function onDinh(a, k) { let tot = 0, ca = 0; for (let y = 2017; y <= 2026; y++) { const c = a.filter((x) => x.nam === y && x[k]), kh = a.filter((x) => x.nam === y && !x[k]); if (c.length < 15 || kh.length < 15) continue; tot++; if (tb(c.map((x) => x.r10)) > tb(kh.map((x) => x.r10))) ca++; } return `${ca}/${tot} nam`; }
for (const [ten, loc] of [["MOI DIEM B (giam >= 15%)", (x) => x.t >= "2017-01-01"], ["DIEM B GIAM >= 20% + KL >= 2x (chua loc thi truong)", (x) => x.t >= "2017-01-01" && x.giam >= 20 && x.KL], ["BO LOC KHUYEN NGHI (giam >= 20% + KL + VNI yeu)", (x) => x.t >= "2017-01-01" && x.giam >= 20 && x.KL && x.VNI_YEU]]) {
  const a = ev.filter(loc);
  console.log(`\n######## ${ten}: ${a.length} diem ########`);
  dong("tat ca", a);
  for (const k of FE) {
    console.log(`  == ${k} (on dinh: ${onDinh(a, k)})`);
    for (const [tk2, kl] of [["truoc 2022-05", (x) => x.ky === 0], ["tu 2022-05", (x) => x.ky === 1], ["2026", (x) => x.nam === 2026]]) { console.log(`    ${tk2}`); dong("co", a.filter((x) => kl(x) && x[k])); dong("khong", a.filter((x) => kl(x) && !x[k])); }
  }
}
// ngoai ra: theo tung nganh, diem B (tu 2022-05) - nganh nao diem B hoat dong tot
console.log("\n######## THEO TUNG NGANH (tu 2022-05, diem B giam >= 15%): lai 10 / 20 phien ########");
const ngs = [...new Set(ev.map((e) => e.ng))];
for (const ng of ngs.sort()) { const a = ev.filter((x) => x.ng === ng && x.ky === 1); if (a.length >= 40) dong(ng, a); }
