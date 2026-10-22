// DIEM B VA CHU KY NGANH (Hieu 2026-10-22: "kiem tra cac nganh hoat dong tot co phai hoi theo chu ky nganh").
// Cau hoi: ket qua tot cua diem B o mot so nganh (Dau khi, Hoa chat, Thep, Ngan hang...) la do CHU KY CUA CA NGANH (nganh dang o pha tang / vua dao chieu) hay do dac diem tung ma?
// (1) CHI SO NGANH: trung binh don gian loi suat ngay cua cac ma cung nganh (GTGD >= 3 ty, >= 4 ma; BDS KCN gop vao BDS) -> chi so tich luy. Tai ngay diem B (chi dung du lieu den het ngay do) gan dac trung PHA NGANH:
//   TREN_MA50: chi so nganh > MA50 cua no;  TANG_60: loi suat 60 phien cua nganh >= 0;  RS_VNI: loi suat 60 phien cua nganh > cua VN-Index;  GIAM_SAU: chi so nganh thap hon dinh 120 phien >= 15% (nganh dang giam sau);
//   PHUC_HOI: chi so nganh da hoi >= 5% tu day 20 phien (nganh dang hoi).
// (2) Do lai 10 / 20 phien (mua MO CUA phien sau, phi 0,4%) co / khong dac trung, truoc 2022-05 / tu 2022-05 / 2026 va ON DINH THEO NAM.
// (3) BEN VUNG THEO THOI GIAN: tuong quan lai 10 phien trung binh cua cung 1 nganh giua quy nay va quy truoc (chu ky co lap lai khong) va ty le phuong sai lai giai thich boi (nganh x quy) so voi (nganh) va (quy) rieng le.
// (4) Bang theo nganh (tu 2022-05): lai trung binh diem B, ty le diem B xuat hien khi nganh o pha tang. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBChuKyNganh.mjs
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
const NGANH_CUA = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!NGANH_CUA.has(m)) NGANH_CUA.set(m, ten === "BDS Khu cong nghiep" ? "Bat dong san" : ten);
const lich = vni.map((x) => x.t), vIdx = new Map(lich.map((d, i) => [d, i])), vc = vni.map((x) => x.c);
const NV = lich.length;

// ---- chi so nganh ----
const tong = {}, dem = {};
const SE = {};
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const ng = NGANH_CUA.get(ma); if (!ng) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  let g = 0; const gt = c.map((x, i) => { g += (x * v[i]) / 1e6; if (i >= 20) g -= (c[i - 20] * v[i - 20]) / 1e6; return i >= 19 ? g / 20 : 0; });
  SE[ma] = { n, c, h, l, v, o, t, gt, ng };
  const S = (tong[ng] ||= new Float64Array(NV)), D = (dem[ng] ||= new Int32Array(NV));
  for (let i = 1; i < n; i++) { if (gt[i - 1] < 3) continue; const k = vIdx.get(t[i]); if (k == null) continue; S[k] += c[i] / c[i - 1] - 1; D[k]++; }
}
const chiSo = {};
for (const ng of Object.keys(tong)) { const a = new Float64Array(NV); a[0] = 100; for (let k = 1; k < NV; k++) a[k] = a[k - 1] * (1 + (dem[ng][k] >= 4 ? tong[ng][k] / dem[ng][k] : 0)); chiSo[ng] = a; }
const ma50 = (a, k) => { let s = 0; for (let j = k - 49; j <= k; j++) s += a[j]; return s / 50; };

// ---- diem B ----
const ev = [];
for (const [ma, s] of Object.entries(SE)) {
  const { n, c, h, l, v, o, t, gt, ng } = s;
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
    const k = vIdx.get(t[i]); if (k == null || k < 130) continue;
    const ci = chiSo[ng]; const E = o[i + 1];
    const ret60 = (ci[k] / ci[k - 60] - 1) * 100, vret60 = (vc[k] / vc[k - 60] - 1) * 100;
    ev.push({
      ma, ng, t: t[i], nam: Number(t[i].slice(0, 4)), quy: `${t[i].slice(0, 4)}Q${Math.floor((Number(t[i].slice(5, 7)) - 1) / 3) + 1}`, ky: t[i] < "2022-05-01" ? 0 : 1, giam,
      TREN_MA50: ci[k] > ma50(ci, k), TANG_60: ret60 >= 0, RS_VNI: ret60 > vret60, GIAM_SAU: ci[k] <= 0.85 * hh(ci, k, 120), PHUC_HOI: ci[k] >= 1.05 * ll(ci, k, 20),
      r10: (c[i + 11] / E - 1) * 100 - CP, r20: (c[i + 21] / E - 1) * 100 - CP,
    });
  }
}
const FE = ["TREN_MA50", "TANG_60", "RS_VNI", "GIAM_SAU", "PHUC_HOI"];
const dong = (ten, a) => (a.length < 25
  ? console.log(`     ${ten.padEnd(12)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`     ${ten.padEnd(12)} n=${String(a.length).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10))).padStart(6)} [${f(th(a.map((x) => x.r10)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20))).padStart(6)} [${f(th(a.map((x) => x.r20)), 0)}%]`));
function onDinh(a, k) { let tot = 0, ca = 0; for (let y = 2017; y <= 2026; y++) { const c = a.filter((x) => x.nam === y && x[k]), kh = a.filter((x) => x.nam === y && !x[k]); if (c.length < 15 || kh.length < 15) continue; tot++; if (tb(c.map((x) => x.r10)) > tb(kh.map((x) => x.r10))) ca++; } return `${ca}/${tot} nam`; }
for (const [ten, bl] of [["MOI DIEM B (giam >= 15%)", (x) => x.t >= "2017-01-01"], ["GIAM >= 20%", (x) => x.t >= "2017-01-01" && x.giam >= 20]]) {
  const a = ev.filter(bl);
  console.log(`\n######## ${ten}: ${a.length} diem ########`); dong("tat ca", a);
  for (const k of FE) {
    console.log(`  == ${k} (on dinh theo nam: ${onDinh(a, k)})`);
    for (const [tk, kl] of [["truoc 2022-05", (x) => x.ky === 0], ["tu 2022-05", (x) => x.ky === 1], ["2026", (x) => x.nam === 2026]]) { console.log(`    ${tk}`); dong("co", a.filter((x) => kl(x) && x[k])); dong("khong", a.filter((x) => kl(x) && !x[k])); }
  }
}
// ---- ben vung theo thoi gian ----
console.log("\n######## BEN VUNG THEO THOI GIAN (moi diem B, 2017+) ########");
const cel = new Map(); for (const e of ev) { if (e.t < "2017-01-01") continue; const key = `${e.ng}|${e.quy}`; (cel.get(key) ?? cel.set(key, []).get(key)).push(e.r10); }
const quys = [...new Set(ev.filter((e) => e.t >= "2017-01-01").map((e) => e.quy))].sort(), ngs = [...new Set(ev.map((e) => e.ng))];
const cap = []; // (quy truoc, quy nay) cung nganh, n >= 8 moi o
for (const ng of ngs) for (let q = 1; q < quys.length; q++) { const a = cel.get(`${ng}|${quys[q - 1]}`), b = cel.get(`${ng}|${quys[q]}`); if (a && b && a.length >= 8 && b.length >= 8) cap.push([tb(a), tb(b)]); }
const corr = (p) => { const mx = tb(p.map((x) => x[0])), my = tb(p.map((x) => x[1])); let sxy = 0, sxx = 0, syy = 0; for (const [x, y] of p) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; } return sxy / Math.sqrt(sxx * syy); };
console.log(`   Tuong quan lai 10 phien TB cua CUNG nganh giua quy truoc va quy nay: r = ${f(corr(cap), 2)} (${cap.length} cap nganh-quy, moi o >= 8 diem B)`);
const t2017 = ev.filter((e) => e.t >= "2017-01-01"), all = tb(t2017.map((e) => e.r10));
const sst = t2017.reduce((s, e) => s + (e.r10 - all) ** 2, 0);
const r2 = (keyFn) => { const m = new Map(); for (const e of t2017) { const k = keyFn(e); (m.get(k) ?? m.set(k, []).get(k)).push(e.r10); } let sse = 0; for (const a of m.values()) { const mu = tb(a); sse += a.reduce((s, x) => s + (x - mu) ** 2, 0); } return 1 - sse / sst; };
console.log(`   Ty le phuong sai lai 10 phien giai thich boi: nganh ${f(r2((e) => e.ng) * 100, 1)}% | quy ${f(r2((e) => e.quy) * 100, 1)}% | nganh x quy ${f(r2((e) => `${e.ng}|${e.quy}`) * 100, 1)}% (so o: ${new Set(t2017.map((e) => `${e.ng}|${e.quy}`)).size} / ${t2017.length} diem; luu y nhieu o nho tu giai thich)`);
// ---- theo nganh ----
console.log("\n######## THEO NGANH (tu 2022-05): lai diem B va PHA NGANH luc do ########");
console.log(`   ${"Nganh".padEnd(26)} ${"n".padStart(4)} | 10p    20p   | %diem B luc nganh tren MA50 / tang 60p / hoi tu day | lai 10p khi nganh TREN MA50 vs DUOI`);
for (const ng of [...ngs].sort()) {
  const a = ev.filter((x) => x.ng === ng && x.ky === 1); if (a.length < 40) continue;
  const p = (k) => f((a.filter((x) => x[k]).length / a.length) * 100, 0);
  console.log(`   ${ng.padEnd(26)} ${String(a.length).padStart(4)} | ${f(tb(a.map((x) => x.r10))).padStart(5)} ${f(tb(a.map((x) => x.r20))).padStart(5)} | ${p("TREN_MA50").padStart(3)}% / ${p("TANG_60").padStart(3)}% / ${p("PHUC_HOI").padStart(3)}% | ${f(tb(a.filter((x) => x.TREN_MA50).map((x) => x.r10)))} (${a.filter((x) => x.TREN_MA50).length}) vs ${f(tb(a.filter((x) => !x.TREN_MA50).map((x) => x.r10)))} (${a.filter((x) => !x.TREN_MA50).length})`);
}
