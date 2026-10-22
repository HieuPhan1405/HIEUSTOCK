// DIEM B THEO TUNG NGANH + NGANH LON CO HOI TOT HON KHONG (Hieu 2026-10-22: "xem cac nganh lon co phai hoi tot hon, cho toi du lieu tung nganh").
// Quy mo nganh = so ma GTGD TB20 >= 3 ty va TONG GTGD TB20 (ty / phien) cua nganh (trung binh cac thang tu 2024-10 den nay, de khong phu thuoc 1 ngay). (BDS KCN gop vao BDS.)
// Moi diem B: giam >= 15% tu dinh 20 phien, dong cua tren Tenkan 9 + Kijun 17, day cach >= 3 phien, GTGD >= 3 ty, 1 lan / 15 phien; vao MO CUA phien sau, phi 0,4%.
// In: (1) bang tung nganh (tu 2022-05): quy mo, so diem B, lai 5 / 10 / 20 phien, ty le thang, thung day, hoi toi da 20 phien (trung vi), rieng giam 20-30%, rieng bo loc khuyen nghi, rieng 2026, so nam duong; (2) so sanh nganh LON (top 5 theo GTGD) / VUA (6-11) / NHO (con lai)
// va tuong quan hang (Spearman) giua quy mo nganh va lai diem B giua cac nganh; (3) ghi file CSV ra Desktop. CHI DOC cache. CACH CHAY: node engine/dich-vu/diemBTheoNganhLonNho.mjs
import { writeFileSync } from "node:fs";
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const CP = 0.4;
const NGANH_CUA = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!NGANH_CUA.has(m)) NGANH_CUA.set(m, ten === "BDS Khu cong nghiep" ? "Bat dong san" : ten);
const vIdx = new Map(vni.map((x, i) => [x.t, i])), vc = vni.map((x) => x.c);
const vSua = vni.map((_, i) => (i >= 59 ? (vc[i] / hh(vc, i, 60) - 1) * 100 : 0));

// ---- quy mo nganh: moi thang (phien cuoi thang) tu 2024-10: so ma GTGD >= 3 ty va tong GTGD TB20 ----
const quyMo = {}; const thangs = new Set();
const SE = {};
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const ng = NGANH_CUA.get(ma); if (!ng) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  let g = 0; const gt = c.map((x, i) => { g += (x * v[i]) / 1e6; if (i >= 20) g -= (c[i - 20] * v[i - 20]) / 1e6; return i >= 19 ? g / 20 : 0; });
  SE[ma] = { n, c, h, l, v, o, t, gt, ng };
  for (let i = 20; i < n; i++) {
    if (t[i] < "2024-10-01" || (i + 1 < n && t[i + 1].slice(0, 7) === t[i].slice(0, 7))) continue; // phien cuoi thang
    if (gt[i] < 3) continue;
    const th2 = t[i].slice(0, 7); thangs.add(th2);
    const q = (quyMo[ng] ||= {}); const x = (q[th2] ||= { so: 0, gtgd: 0 }); x.so++; x.gtgd += gt[i];
  }
}
const nT = thangs.size;
const QM = Object.fromEntries(Object.entries(quyMo).map(([ng, m]) => [ng, { so: tb(Object.values(m).map((x) => x.so)), gtgd: tb(Object.values(m).map((x) => x.gtgd)) }]));
const tongGtgd = Object.values(QM).reduce((s, x) => s + x.gtgd, 0);

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
    let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
    let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
    const vi = vIdx.get(t[i]); if (vi == null) continue;
    const E = o[i + 1]; let m20 = Infinity, mx = -Infinity; for (let j = i + 1; j <= i + 20; j++) { m20 = Math.min(m20, l[j]); mx = Math.max(mx, h[j]); }
    ev.push({ ma, ng, t: t[i], nam: Number(t[i].slice(0, 4)), giam, KL: tb20 > 0 && vMax >= 2 * tb20, VNI_YEU: vSua[vi] <= -7, r5: (c[i + 6] / E - 1) * 100 - CP, r10: (c[i + 11] / E - 1) * 100 - CP, r20: (c[i + 21] / E - 1) * 100 - CP, thung: m20 < day, mx20: (mx / E - 1) * 100 });
  }
}
const sau = ev.filter((x) => x.t >= "2022-05-01");
const ngs = Object.keys(QM).sort((a, b) => QM[b].gtgd - QM[a].gtgd);
const hang = ngs.map((ng) => {
  const a = sau.filter((x) => x.ng === ng), h2030 = a.filter((x) => x.giam >= 20 && x.giam < 30), kn = a.filter((x) => x.giam >= 20 && x.KL && x.VNI_YEU), n26 = a.filter((x) => x.nam === 2026);
  let namDuong = 0, namTot = 0; for (let y = 2022; y <= 2026; y++) { const z = a.filter((x) => x.nam === y); if (z.length >= 10) { namTot++; if (tb(z.map((x) => x.r10)) > 0) namDuong++; } }
  return {
    ng, so: QM[ng].so, gtgd: QM[ng].gtgd, ty: (QM[ng].gtgd / tongGtgd) * 100, n: a.length, r5: tb(a.map((x) => x.r5)), r10: tb(a.map((x) => x.r10)), r20: tb(a.map((x) => x.r20)), w10: th(a.map((x) => x.r10)), thung: (a.filter((x) => x.thung).length / (a.length || 1)) * 100, mx: med(a.map((x) => x.mx20)),
    n2030: h2030.length, r2030: tb(h2030.map((x) => x.r10)), nkn: kn.length, rkn: tb(kn.map((x) => x.r10)), n26: n26.length, r26: tb(n26.map((x) => x.r10)), namDuong: `${namDuong}/${namTot}`,
  };
});
console.log(`Quy mo = trung binh ${nT} thang cuoi thang tu 2024-10; ${ngs.length} nganh, tong GTGD ${f(tongGtgd, 0)} ty/phien. Diem B tu 2022-05: ${sau.length}.\n`);
const cot = (s, w) => String(s).padStart(w);
console.log(`${"Nganh".padEnd(26)} ${cot("so ma", 5)} ${cot("GTGD ty", 8)} ${cot("%GTGD", 6)} | ${cot("n B", 4)} ${cot("5p", 6)} ${cot("10p", 6)} ${cot("20p", 6)} ${cot("thang10", 7)} ${cot("thung", 5)} ${cot("hoi max", 7)} | ${cot("n 20-30", 7)} ${cot("10p", 6)} | ${cot("n KN", 4)} ${cot("10p", 6)} | ${cot("n 2026", 6)} ${cot("10p", 6)} | nam duong`);
for (const x of hang) console.log(`${x.ng.padEnd(26)} ${cot(f(x.so, 1), 5)} ${cot(f(x.gtgd, 0), 8)} ${cot(f(x.ty, 1), 6)} | ${cot(x.n, 4)} ${cot(f(x.r5), 6)} ${cot(f(x.r10), 6)} ${cot(f(x.r20), 6)} ${cot(f(x.w10, 0) + "%", 7)} ${cot(f(x.thung, 0) + "%", 5)} ${cot(f(x.mx, 1) + "%", 7)} | ${cot(x.n2030, 7)} ${cot(f(x.r2030), 6)} | ${cot(x.nkn, 4)} ${cot(f(x.rkn), 6)} | ${cot(x.n26, 6)} ${cot(f(x.r26), 6)} | ${x.namDuong}`);
// ---- nganh lon / vua / nho ----
const nhom = (r) => (r < 5 ? "LON (top 5 GTGD)" : r < 11 ? "VUA (hang 6-11)" : "NHO (con lai)");
console.log("\n######## NGANH LON / VUA / NHO (tu 2022-05, gop diem B) ########");
for (const g of ["LON (top 5 GTGD)", "VUA (hang 6-11)", "NHO (con lai)"]) {
  const tap = ngs.filter((ng, i) => nhom(i) === g), a = sau.filter((x) => tap.includes(x.ng));
  const kn = a.filter((x) => x.giam >= 20 && x.KL && x.VNI_YEU), h2030 = a.filter((x) => x.giam >= 20 && x.giam < 30);
  console.log(`   ${g.padEnd(20)} ${tap.join(", ")}\n      moi diem B n=${a.length}: 10p ${f(tb(a.map((x) => x.r10)))} [${f(th(a.map((x) => x.r10)), 0)}%] 20p ${f(tb(a.map((x) => x.r20)))} thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0)}% | giam 20-30%: n=${h2030.length} 10p ${f(tb(h2030.map((x) => x.r10)))} | khuyen nghi: n=${kn.length} 10p ${f(tb(kn.map((x) => x.r10)))} [${f(th(kn.map((x) => x.r10)), 0)}%]`);
}
// tuong quan hang
const rank = (a) => { const s = a.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); s.forEach(([, i], k) => (r[i] = k)); return r; };
const sp = (x, y) => { const rx = rank(x), ry = rank(y), n = x.length, mx = tb(rx), my = tb(ry); let a = 0, b = 0, c2 = 0; for (let i = 0; i < n; i++) { a += (rx[i] - mx) * (ry[i] - my); b += (rx[i] - mx) ** 2; c2 += (ry[i] - my) ** 2; } return a / Math.sqrt(b * c2); };
const du = hang.filter((x) => x.n >= 40);
console.log(`\nTuong quan hang (Spearman) giua quy mo nganh va lai 10 phien diem B (${du.length} nganh co >= 40 diem B): GTGD ${f(sp(du.map((x) => x.gtgd), du.map((x) => x.r10)), 2)} | so ma ${f(sp(du.map((x) => x.so), du.map((x) => x.r10)), 2)} | thung day ${f(sp(du.map((x) => x.gtgd), du.map((x) => x.thung)), 2)} (GTGD vs ty le thung day)`);
// CSV
const tieuDe = "nganh,so_ma,gtgd_ty_phien,ty_trong_gtgd_pct,so_diem_b_tu_2022_05,lai_5p,lai_10p,lai_20p,thang_10p_pct,thung_day_pct,hoi_toi_da_20p_trung_vi,so_diem_giam_20_30,lai_10p_giam_20_30,so_diem_khuyen_nghi,lai_10p_khuyen_nghi,so_diem_2026,lai_10p_2026,nam_duong";
const dongCsv = hang.map((x) => [x.ng, f(x.so, 1), f(x.gtgd, 0), f(x.ty, 1), x.n, f(x.r5), f(x.r10), f(x.r20), f(x.w10, 0), f(x.thung, 0), f(x.mx, 1), x.n2030, f(x.r2030), x.nkn, f(x.rkn), x.n26, f(x.r26), x.namDuong].join(","));
const duong = "C:/Users/hieu/Desktop/DiemB_TheoNganh.csv";
writeFileSync(duong, "\uFEFF" + [tieuDe, ...dongCsv].join("\n") + "\n", "utf-8");
console.log(`\nDa ghi CSV: ${duong}`);
