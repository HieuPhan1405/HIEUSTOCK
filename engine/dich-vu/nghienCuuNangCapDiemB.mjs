// NANG CAP DIEM B - TIM YEU TO ON DINH THEO NAM (Hieu 2026-10-21: "giu phan diem B do va nang cap them, test tiep").
// Van de da thay: "KL quanh day >= 2x" tot trong 2022 va 2025 (dot sap + hoi) nhung am trong 2024 / 2026 -> yeu to phu thuoc CHE DO THI TRUONG. Thu them cac dac trung va cach ghep, cham diem theo DO ON DINH (so nam tot hon / tong so nam) chu khong chi trung binh:
//   KL      : KL lon nhat 5 phien quanh day >= 2x TB20 truoc day;
//   CK_TRUOC: checklist do day (>= 5 diem, engine/loi/checklistBatDay.js) da bao trong 15 phien truoc diem B (canh bao day + xac nhan quay dau);
//   SUA_VNI : VN-Index dong cua <= -7% so dinh 60 phien tai ngay diem B (thi truong dang dieu chinh / sap);
//   RONG_YEU: >= 60% so ma (GTGD >= 3 ty) dong cua duoi MA50 tai ngay diem B (suy yeu dien rong);
//   VNI_QUA_BAN: RSI14 cua VN-Index < 35 trong 10 phien truoc diem B;
//   GIAM_NHANH: giam >= 20% chi trong <= 10 phien (cu sap nhanh, khong phai giam cham);
//   KL_VA_SUA: KL + SUA_VNI.
// Diem B: giam >= 15% tu dinh 20 phien (close) trong 11 phien gan nhat, dong cua tren Tenkan 9 va Kijun 17, day 20 phien cach >= 3 phien, GTGD TB20 >= 3 ty, 1 lan / 15 phien. Vao MO CUA phien sau, phi 0,4%.
// In: tung dac trung co / khong, tach truoc 2022-05 / tu 2022-05, kem "on dinh" = so nam (n >= 15 moi nhom) ma nhom CO tot hon nhom KHONG o lai 10 phien, tren tong so nam du mau. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuNangCapDiemB.mjs
import { docJson } from "./backtestChung.mjs";
import { hhv, llv, sma } from "../loi/mang.js";
import { rsi, mfi } from "../loi/taChiBao.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const CP = 0.4;
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };

// ---- VN-Index theo ngay ----
const vIdx = new Map(vni.map((x, i) => [x.t, i]));
const vc = vni.map((x) => x.c);
const vRsi = rsi({ close: vc }, 14);
const vSua = vni.map((_, i) => (i >= 59 ? (vc[i] / hh(vc, i, 60) - 1) * 100 : 0));
const vQuaBan = vni.map((_, i) => { for (let k = 0; k <= 10; k++) if (i - k >= 14 && vRsi[i - k] != null && vRsi[i - k] < 35) return true; return false; });

// ---- do rong: ty le ma dong cua duoi MA50 theo ngay (GTGD >= 3 ty) ----
const duoi = new Map(), tong = new Map();
const SE = {};
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  const m50 = sma(c, 50);
  let g = 0; const gt = c.map((x, i) => { g += (x * v[i]) / 1e6; if (i >= 20) g -= (c[i - 20] * v[i - 20]) / 1e6; return i >= 19 ? g / 20 : 0; });
  for (let i = 50; i < n; i++) { if (gt[i] < 3) continue; tong.set(t[i], (tong.get(t[i]) ?? 0) + 1); if (c[i] < m50[i]) duoi.set(t[i], (duoi.get(t[i]) ?? 0) + 1); }
  // checklist: diem tung nen (8 thanh phan, nhu engine/loi/checklistBatDay.js)
  const h252 = hhv(h, 252);
  const ck = c.map((x, i) => (h252[i] > 0 ? ((h252[i] - x) / h252[i]) * 100 : null));
  const rs = rsi({ close: c }, 14), mf = mfi({ high: h, low: l, close: c, volume: v }, 14);
  const hh14 = hhv(h, 14), ll14 = llv(l, 14);
  const m200 = sma(c, 200);
  const av = sma(v, 20); const bd = h.map((x, i) => x - l[i]); const ab = sma(bd, 20);
  const d20 = llv(l, 20);
  const diem = c.map((x, i) => {
    if (i < 252) return 0;
    const w = hh14[i] !== ll14[i] ? ((hh14[i] - x) / (hh14[i] - ll14[i])) * -100 : 0;
    const dev = m200[i] > 0 ? ((x - m200[i]) / m200[i]) * 100 : 0;
    const cap = i > 0 && av[i] != null && ab[i] != null && x < c[i - 1] && v[i] > av[i] * 2 && bd[i] > ab[i] * 1.5;
    return (ck[i] >= 20 ? 1 : 0) + (rs[i] != null && rs[i] < 35 ? 0.5 : 0) + (mf[i] != null && mf[i] < 30 ? 0.5 : 0) + (w < -80 ? 1 : 0) + (dev <= -12 ? 1 : 0) + (cap ? 1 : 0)
      + (i > 0 && x >= c[i - 1] * 1.0125 && v[i] > v[i - 1] && ck[i] >= 15 ? 2 : 0) + (l[i] === d20[i] ? 0 : 0);
  });
  SE[ma] = { n, c, h, l, v, o, t, gt, diem };
}

// ---- diem B + dac trung ----
const ev = [];
for (const [ma, s] of Object.entries(SE)) {
  const { n, c, h, l, v, o, t, gt, diem } = s;
  let ult = -99;
  for (let i = 270; i < n - 21; i++) {
    if (gt[i] < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 15) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    if (!(c[i] > tk && c[i] > kj)) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 3 || i - ult < 15) continue;
    ult = i;
    const vi = vIdx.get(t[i]); if (vi == null || vi < 70) continue;
    let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
    let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
    let ckTruoc = false; for (let j = i - 15; j <= i; j++) if (diem[j] >= 5) { ckTruoc = true; break; }
    const ngay = t[i];
    // phien tu dinh 20p toi day
    let i20 = kDay; const d20h = hh(h, kDay, 20); for (let j = kDay - 19; j <= kDay; j++) if (h[j] === d20h) i20 = j;
    const E = o[i + 1];
    ev.push({
      ma, t: ngay, nam: Number(ngay.slice(0, 4)), ky: ngay < "2022-05-01" ? 0 : 1, giam,
      KL: tb20 > 0 && vMax >= 2 * tb20, CK_TRUOC: ckTruoc, SUA_VNI: vSua[vi] <= -7,
      RONG_YEU: (tong.get(ngay) ?? 0) > 50 && (duoi.get(ngay) ?? 0) / tong.get(ngay) >= 0.6,
      VNI_QUA_BAN: vQuaBan[vi], GIAM_NHANH: kDay - i20 <= 10,
      r10: (c[i + 11] / E - 1) * 100 - CP, r20: (c[i + 21] / E - 1) * 100 - CP,
    });
  }
}
for (const e of ev) e.KL_VA_SUA = e.KL && e.SUA_VNI;

const FE = ["KL", "CK_TRUOC", "SUA_VNI", "RONG_YEU", "VNI_QUA_BAN", "GIAM_NHANH", "KL_VA_SUA"];
const dong = (ten, a) => (a.length < 25
  ? console.log(`     ${ten.padEnd(26)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`     ${ten.padEnd(26)} n=${String(a.length).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10))).padStart(6)} [${f(th(a.map((x) => x.r10)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20))).padStart(6)} [${f(th(a.map((x) => x.r20)), 0)}%]`));
function onDinh(a, k) {
  let tot = 0, ca = 0;
  for (let y = 2014; y <= 2026; y++) {
    const c = a.filter((x) => x.nam === y && x[k]), kh = a.filter((x) => x.nam === y && !x[k]);
    if (c.length < 15 || kh.length < 15) continue;
    tot++; if (tb(c.map((x) => x.r10)) > tb(kh.map((x) => x.r10))) ca++;
  }
  return `${ca}/${tot} nam`;
}
for (const [tenNhom, loc] of [["DIEM B giam >= 15% (moi diem B)", () => true], ["DIEM B giam >= 20%", (x) => x.giam >= 20]]) {
  const a = ev.filter(loc);
  console.log(`\n######## ${tenNhom}: ${a.length} diem ########`);
  dong("tat ca", a);
  for (const k of FE) {
    console.log(`  == ${k}  (on dinh theo nam, lai 10 phien: ${onDinh(a, k)})`);
    for (const [ten, kyLoc] of [["truoc 2022-05", (x) => x.ky === 0], ["tu 2022-05", (x) => x.ky === 1]]) {
      console.log(`    ${ten}`);
      dong("co", a.filter((x) => kyLoc(x) && x[k])); dong("khong", a.filter((x) => kyLoc(x) && !x[k]));
    }
  }
}
// theo nam cho KL va KL_VA_SUA (giam >= 20%)
console.log("\n######## THEO NAM (giam >= 20%): lai 10 phien, KL co / KL khong / KL+SUA_VNI co ########");
const g20 = ev.filter((x) => x.giam >= 20);
for (let y = 2014; y <= 2026; y++) {
  const a = g20.filter((x) => x.nam === y), kl = a.filter((x) => x.KL), nk = a.filter((x) => !x.KL), ks = a.filter((x) => x.KL_VA_SUA), rs = a.filter((x) => x.RONG_YEU);
  console.log(`   ${y}: KL n=${String(kl.length).padStart(3)} ${f(tb(kl.map((x) => x.r10))).padStart(6)} | khong KL n=${String(nk.length).padStart(3)} ${f(tb(nk.map((x) => x.r10))).padStart(6)} | KL+SUA_VNI n=${String(ks.length).padStart(3)} ${f(tb(ks.map((x) => x.r10))).padStart(6)} | RONG_YEU n=${String(rs.length).padStart(3)} ${f(tb(rs.map((x) => x.r10))).padStart(6)}`);
}
