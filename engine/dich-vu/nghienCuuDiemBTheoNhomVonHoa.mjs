// DIEM B THEO NHOM VON HOA (Hieu 2026-10-22: "kiem tra lai co phai co midcap nhay hon cac diem phuc hoi"). Chia moi diem B (giam >= 15% tu dinh 20 phien, dong cua tren Tenkan 9 + Kijun 17, day cach >= 3 phien, GTGD >= 3 ty, 1 lan / 15 phien)
// theo nhom VN30 / Midcap / Smallcap (engine/danh-sach/vonHoa.js) va ma ngoai 3 nhom. Do: lai 5 / 10 / 20 phien (mua MO CUA phien sau, phi 0,4%), ty le thang, thung day 20 phien, bien do hoi toi da trong 20 phien (do "nhay"),
// trong 3 truong hop: moi diem B | giam 20-30% | bo loc khuyen nghi (giam >= 20% + KL day >= 2x + VN-Index yeu). Chia truoc 2022-05 / tu 2022-05 / 2026 va on dinh theo nam (nhom nao tot hon trung binh bao nhieu nam). CHI DOC cache.
// CACH CHAY: node engine/dich-vu/nghienCuuDiemBTheoNhomVonHoa.mjs
import { docJson } from "./backtestChung.mjs";
import { phanLoaiVonHoa } from "../danh-sach/vonHoa.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const CP = 0.4;
const vIdx = new Map(vni.map((x, i) => [x.t, i])), vc = vni.map((x) => x.c);
const vSua = vni.map((_, i) => (i >= 59 ? (vc[i] / hh(vc, i, 60) - 1) * 100 : 0));
console.log("vi du phan loai:", ["VCB", "NVL", "CEO", "CII", "HDC", "SHS", "VIX"].map((m) => `${m}=${phanLoaiVonHoa(m)}`).join(" "));

const ev = [];
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const nhom = phanLoaiVonHoa(ma) || "Khac";
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  let ult = -99;
  for (let i = 270; i < n - 21; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 15) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    if (!(c[i] > tk && c[i] > kj)) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 3 || i - ult < 15) continue;
    ult = i;
    let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
    let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
    const vi = vIdx.get(t[i]); if (vi == null) continue;
    const E = o[i + 1]; let m20 = Infinity, mx = -Infinity; for (let j = i + 1; j <= i + 20; j++) { m20 = Math.min(m20, l[j]); mx = Math.max(mx, h[j]); }
    let atr = 0; for (let j = i - 13; j <= i; j++) atr += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])); atr = (atr / 14 / c[i]) * 100;
    ev.push({
      ma, nhom, t: t[i], nam: Number(t[i].slice(0, 4)), ky: t[i] < "2022-05-01" ? 0 : 1, giam, KL: tb20 > 0 && vMax >= 2 * tb20, VNI_YEU: vSua[vi] <= -7, atr,
      r5: (c[i + 6] / E - 1) * 100 - CP, r10: (c[i + 11] / E - 1) * 100 - CP, r20: (c[i + 21] / E - 1) * 100 - CP, thung: m20 < day, mx20: (mx / E - 1) * 100,
    });
  }
}
const NHOM = ["VN30", "Midcap", "Smallcap", "Khac"];
const dong = (ten, a) => (a.length < 25
  ? console.log(`   ${ten.padEnd(10)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`   ${ten.padEnd(10)} n=${String(a.length).padStart(5)} | 5p ${f(tb(a.map((x) => x.r5))).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10))).padStart(5)} [${f(th(a.map((x) => x.r10)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20))).padStart(5)} [${f(th(a.map((x) => x.r20)), 0)}%] | thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0)}% | hoi toi da 20p ${f(med(a.map((x) => x.mx20)), 1)}% (TB ${f(tb(a.map((x) => x.mx20)), 1)}%) | ATR% ${f(tb(a.map((x) => x.atr)), 1)}`));
const BO = [["MOI DIEM B (giam >= 15%)", () => true], ["GIAM 20-30%", (x) => x.giam >= 20 && x.giam < 30], ["BO LOC KHUYEN NGHI (giam >= 20% + KL day >= 2x + VNI yeu)", (x) => x.giam >= 20 && x.KL && x.VNI_YEU]];
for (const [ten, bl] of BO) {
  for (const [tk, kl] of [["toan bo 2017+", (x) => x.t >= "2017-01-01"], ["truoc 2022-05", (x) => x.ky === 0 && x.t >= "2017-01-01"], ["tu 2022-05", (x) => x.ky === 1], ["2026", (x) => x.nam === 2026]]) {
    console.log(`\n## ${ten} | ${tk}`);
    for (const g of NHOM) dong(g, ev.filter((x) => x.nhom === g && bl(x) && kl(x)));
  }
}
// on dinh theo nam: lai 10 phien tung nhom (moi diem B), n >= 20
console.log("\n######## THEO NAM (moi diem B): lai 10 phien tung nhom (n) ########");
for (let y = 2017; y <= 2026; y++) console.log(`   ${y}: ${NHOM.map((g) => { const a = ev.filter((x) => x.nam === y && x.nhom === g); return `${g} ${a.length >= 20 ? f(tb(a.map((x) => x.r10))).padStart(6) : "   -  "} (${a.length})`; }).join(" | ")}`);
// midcap vs phan con lai: so nam midcap tot hon
let ca = 0, tot = 0, caS = 0;
for (let y = 2017; y <= 2026; y++) { const m = ev.filter((x) => x.nam === y && x.nhom === "Midcap"), k = ev.filter((x) => x.nam === y && x.nhom !== "Midcap"), s = ev.filter((x) => x.nam === y && x.nhom === "Smallcap"); if (m.length < 20 || k.length < 20) continue; tot++; if (tb(m.map((x) => x.r10)) > tb(k.map((x) => x.r10))) ca++; if (s.length >= 20 && tb(s.map((x) => x.r10)) > tb(k.map((x) => x.r10))) caS++; }
console.log(`\nMidcap co lai 10 phien cao hon cac nhom con lai: ${ca}/${tot} nam`);
