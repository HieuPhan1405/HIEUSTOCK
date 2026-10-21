// QUY LUAT TU NHIP HOI GAN DAY (BDS / THEP / CK, 10/2026) -> KIEM CHUNG TREN LICH SU (Hieu 2026-10-21: "dua vao nhung ma bds, thep, ck hoi gan day, hay tim ra quy luat co the vao lenh hieu qua").
// Quan sat nhip hoi vua qua (nghienCuuNhipHoiGanDay.mjs): ca 47 ma tao day TRUOC VN-Index (VN-Index con lap day moi 20/10 trong khi cac ma da hoi 10-20%), day dong loat 6-9/10 trong moi nganh,
// KL quanh day cao thi hoi manh hon (r = 0,41), ma giam nhieu hon thi truong hoi manh hon (r = 0,31). Tu do dat 5 DAC TRUNG va kiem tren TOAN BO lich su (2014-2026, moi nganh, tach BDS/THEP/CK):
//   VNI_YEU  : VN-Index dong cua duoi Kijun 17 cua no tai ngay tin hieu (thi truong chung con yeu);
//   DAN_DAT  : VN-Index lap day 20 phien MOI sau ngay day cua ma (ma giu day trong khi chi so thung day) - suc manh tuong doi;
//   KL_DAY   : KL lon nhat 5 phien quanh day >= 2 lan TB20 truoc day (ban thao co KL);
//   DONG_LOAT: >= 40% so ma cung nganh tao day 20 phien trong +/- 3 phien quanh ngay day cua ma (day cua ca nganh);
//   BREADTH  : ty le ma cung nganh dong cua tren Tenkan + Kijun hom nay >= 50%, va 10 phien truoc co luc <= 25% (ca nganh vua dao chieu).
// Tin hieu goc: diem B (giam >= 15% tu dinh 20 phien trong 11 phien gan nhat, dong cua tren Tenkan 9 va Kijun 17, day 20 phien cach >= 3 phien, GTGD TB20 >= 3 ty, moi ma 1 lan / 15 phien).
// Vao MO CUA phien sau, phi 0,4%. Ket qua: lai 5 / 10 / 20 phien, va QL = cat lo -7% / chot +10% / toi da 10 phien (T+2,5: xet tu phien thu 3). CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuQuyLuatNhipHoi.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const CP = 0.4;
const NGANH_CUA = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!NGANH_CUA.has(m)) NGANH_CUA.set(m, ten);
const NHOM3 = (ten) => (ten === "Thep" ? "THEP" : ten === "Chung khoan" ? "CK" : ten === "Bat dong san" || ten === "BDS Khu cong nghiep" ? "BDS" : null);
const nganhGop = (ma) => { const t = NGANH_CUA.get(ma); return t === "BDS Khu cong nghiep" ? "Bat dong san" : t; };

// ---- VN-Index ----
const vIdx = new Map(vni.map((x, i) => [x.t, i]));
const vc = vni.map((x) => x.c), vh = vni.map((x) => x.h), vl = vni.map((x) => x.l);
const vKij = vni.map((_, i) => (i >= 16 ? (hh(vh, i, 17) + ll(vl, i, 17)) / 2 : null));
const vDayMoi = vni.map((_, i) => i >= 19 && vl[i] <= ll(vl, i, 20)); // VN-Index lap day 20 phien moi tai ngay i

// ---- chuan bi tung ma + do rong nganh theo ngay ----
const SE = {};
const nganhNgay = {}; // nganh -> Map(ngay -> { n, tren, day })
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 300) continue;
  const ng = nganhGop(ma); if (!ng) continue;
  const n = b.length, c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  const tk = c.map((_, i) => (i >= 8 ? (hh(h, i, 9) + ll(l, i, 9)) / 2 : null)), kj = c.map((_, i) => (i >= 16 ? (hh(h, i, 17) + ll(l, i, 17)) / 2 : null));
  SE[ma] = { ng, n, c, h, l, v, o, t, tk, kj };
  const M = (nganhNgay[ng] ||= new Map());
  for (let i = 20; i < n; i++) {
    const r = M.get(t[i]) ?? { n: 0, tren: 0, day: 0 }; r.n++;
    if (tk[i] != null && c[i] > tk[i] && c[i] > kj[i]) r.tren++;
    if (l[i] <= ll(l, i, 20)) r.day++;
    M.set(t[i], r);
  }
}
const ngayTheo = vni.map((x) => x.t);
const tyLe = (ng, d, k) => { const r = nganhNgay[ng]?.get(d); return r && r.n >= 4 ? r[k] / r.n : null; };

// ---- su kien ----
const ev = [];
for (const [ma, s] of Object.entries(SE)) {
  const { ng, n, c, h, l, v, o, t, tk, kj } = s;
  let ult = -99;
  for (let i = 130; i < n - 21; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 15) continue;
    if (!(tk[i] != null && c[i] > tk[i] && c[i] > kj[i])) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 3 || i - ult < 15) continue;
    ult = i;
    const vi = vIdx.get(t[i]), vD = vIdx.get(t[kDay]); if (vi == null || vD == null || vi < 30) continue;
    // dac trung
    const VNI_YEU = vKij[vi] != null && vc[vi] < vKij[vi];
    let DAN_DAT = false; for (let q = vD + 1; q <= vi; q++) if (vDayMoi[q]) { DAN_DAT = true; break; }
    let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
    let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
    const KL_DAY = tb20 > 0 && vMax >= 2 * tb20;
    let tongDay = 0; for (let q = vD - 3; q <= Math.min(vD + 3, vi); q++) { const x = tyLe(ng, ngayTheo[q], "day"); if (x != null) tongDay += x; }
    const DONG_LOAT = tongDay >= 0.4;
    const brNay = tyLe(ng, t[i], "tren"); let brMin = 1; for (let q = vi - 10; q < vi; q++) { const x = tyLe(ng, ngayTheo[q], "tren"); if (x != null) brMin = Math.min(brMin, x); }
    const BREADTH = brNay != null && brNay >= 0.5 && brMin <= 0.25;
    // ket qua
    const E = o[i + 1];
    let ql = c[i + 11], lyDo = "het";
    for (let j = i + 3; j <= i + 11; j++) {
      if (h[j] >= E * 1.1) { ql = Math.max(E * 1.1, o[j]); lyDo = "TP"; break; }
      if (c[j] <= E * 0.93) { ql = c[j]; lyDo = "SL"; break; }
    }
    ev.push({
      ma, ng, n3: NHOM3(NGANH_CUA.get(ma)), t: t[i], ky: t[i] < "2022-05-01" ? 0 : 1, giam,
      VNI_YEU, DAN_DAT, KL_DAY, DONG_LOAT, BREADTH, klTyLe: tb20 > 0 ? vMax / tb20 : 0,
      r5: (c[i + 6] / E - 1) * 100 - CP, r10: (c[i + 11] / E - 1) * 100 - CP, r20: (c[i + 21] / E - 1) * 100 - CP, ql: (ql / E - 1) * 100 - CP, lyDo,
    });
  }
}
const DT = ["VNI_YEU", "DAN_DAT", "KL_DAY", "DONG_LOAT", "BREADTH"];
const dong = (ten, a) => {
  if (a.length < 30) { console.log(`   ${ten.padEnd(44)} n=${String(a.length).padStart(5)} (it mau)`); return; }
  console.log(`   ${ten.padEnd(44)} n=${String(a.length).padStart(5)} | 5p ${f(tb(a.map((x) => x.r5))).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10))).padStart(5)} [${f(th(a.map((x) => x.r10)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20))).padStart(5)} [${f(th(a.map((x) => x.r20)), 0)}%] | QL -7/+10 ${f(tb(a.map((x) => x.ql))).padStart(5)} [${f(th(a.map((x) => x.ql)), 0)}%]`);
};
const TO_HOP = [
  ["DAN_DAT + VNI_YEU", (x) => x.DAN_DAT && x.VNI_YEU],
  ["DAN_DAT + DONG_LOAT", (x) => x.DAN_DAT && x.DONG_LOAT],
  ["DAN_DAT + KL_DAY", (x) => x.DAN_DAT && x.KL_DAY],
  ["DONG_LOAT + BREADTH", (x) => x.DONG_LOAT && x.BREADTH],
  ["DAN_DAT + DONG_LOAT + BREADTH", (x) => x.DAN_DAT && x.DONG_LOAT && x.BREADTH],
  ["DAN_DAT + DONG_LOAT + KL_DAY", (x) => x.DAN_DAT && x.DONG_LOAT && x.KL_DAY],
  ["giam >= 20% + DAN_DAT + DONG_LOAT", (x) => x.giam >= 20 && x.DAN_DAT && x.DONG_LOAT],
];
for (const [tenPham, phamVi] of [["MOI NGANH", () => true], ["CHI BDS + THEP + CK", (x) => x.n3 != null]]) {
  for (const [tk, loc] of [["toan bo", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
    const a = ev.filter((x) => phamVi(x) && loc(x));
    console.log(`\n######## ${tenPham} | ${tk} | ${a.length} diem B (giam >= 15%) ########`);
    dong("TAT CA diem B", a);
    for (const k of DT) { dong(`${k} = co`, a.filter((x) => x[k])); dong(`${k} = khong`, a.filter((x) => !x[k])); }
    console.log("   -- to hop --");
    for (const [ten, fn] of TO_HOP) dong(ten, a.filter(fn));
  }
}
// rieng tung nganh, tu 2022-05: tat ca vs DAN_DAT + DONG_LOAT
console.log("\n######## TUNG NGANH (tu 2022-05): tat ca diem B vs DAN_DAT + DONG_LOAT ########");
for (const n3 of ["BDS", "THEP", "CK"]) { console.log(` -- ${n3}`); const a = ev.filter((x) => x.ky === 1 && x.n3 === n3); dong("tat ca", a); dong("DAN_DAT + DONG_LOAT", a.filter((x) => x.DAN_DAT && x.DONG_LOAT)); dong("DAN_DAT", a.filter((x) => x.DAN_DAT)); }
// so dot doc lap: dem so thang khac nhau co tin hieu DAN_DAT + DONG_LOAT
const thang = new Set(ev.filter((x) => x.DAN_DAT && x.DONG_LOAT).map((x) => x.t.slice(0, 7)));
console.log(`\nSo thang khac nhau co tin hieu DAN_DAT + DONG_LOAT: ${thang.size} (do doc lap: cac tin hieu trong cung 1 thang thuong la cung 1 dot)`);

// ---- KIEM TRA THEM DAC TRUNG MANH NHAT: KL quanh day (ban thao co KL) ----
console.log("\n######## KL QUANH DAY: nguong va to hop (diem B giam >= 15%) ########");
for (const [tenPham, phamVi] of [["MOI NGANH", () => true], ["BDS + THEP + CK", (x) => x.n3 != null]]) {
  for (const [tk, loc] of [["toan bo", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
    const a = ev.filter((x) => phamVi(x) && loc(x));
    console.log(` == ${tenPham} | ${tk}`);
    for (const [lo, hi] of [[0, 1.5], [1.5, 2], [2, 3], [3, 999]]) dong(`KL max quanh day ${lo}-${hi === 999 ? "+" : hi} x TB20`, a.filter((x) => x.klTyLe >= lo && x.klTyLe < hi));
    dong("KL_DAY + VNI_YEU", a.filter((x) => x.KL_DAY && x.VNI_YEU));
    dong("KL_DAY + VN-Index KHONG yeu", a.filter((x) => x.KL_DAY && !x.VNI_YEU));
    dong("KL_DAY + khong DAN_DAT", a.filter((x) => x.KL_DAY && !x.DAN_DAT));
    dong("KL_DAY + giam >= 20%", a.filter((x) => x.KL_DAY && x.giam >= 20));
  }
}
console.log("\n######## KL_DAY theo nam (moi nganh): lai 10 phien / QL ########");
for (let y = 2014; y <= 2026; y++) { const a = ev.filter((x) => x.KL_DAY && x.t.startsWith(String(y))), b2 = ev.filter((x) => !x.KL_DAY && x.t.startsWith(String(y))); console.log(`   ${y}: KL_DAY n=${String(a.length).padStart(4)} 10p ${f(tb(a.map((x) => x.r10))).padStart(6)} QL ${f(tb(a.map((x) => x.ql))).padStart(6)} | khong n=${String(b2.length).padStart(4)} 10p ${f(tb(b2.map((x) => x.r10))).padStart(6)} QL ${f(tb(b2.map((x) => x.ql))).padStart(6)}`); }
console.log(`So thang khac nhau co tin hieu KL_DAY: ${new Set(ev.filter((x) => x.KL_DAY).map((x) => x.t.slice(0, 7))).size}`);
