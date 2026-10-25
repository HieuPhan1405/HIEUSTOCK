// DONG TIEN CHU DONG TREN TOAN THI TRUONG CO DU BAO LOI NHUAN KHONG? (Hieu 2026-10-26: "test tren toan thi truong di"). Du lieu: engine/output/dong_tien_ngay.json (taiDongTienToanThiTruong.mjs) - ~390 ma x ~140 phien tu 2026-04.
// Moi (ma, ngay d) co dac trung: imb = (mua - ban) chu dong / tong chu dong | lon = (lenh lon mua - ban) / tong | nn = khoi ngoai ron / tong | imbRes, lonRes = phan DU cua imb, lon sau khi bo phan giai thich boi bien dong gia CUNG NGAY d (hoi quy cat ngang theo ngay: dong tien chu dong vi dang tang gia ma thanh).
// Loc: GTGD TB20 >= 5 ty va tong chu dong >= 200 trieu. Moi ngay chia NGU PHAN VI theo dac trung (>= 40 ma), lai SAU: r1 = mo cua d+2 / mo cua d+1 - 1 (vao mo cua phien ke tiep, giu 1 phien), r5 = dong cua d+5 / mo cua d+1 - 1, TRU TRUNG BINH CA NGAY (de loai bien dong thi truong).
// Bao cao: lai TB tung nhom (bps = 0,01%), CHENH LECH nhom 5 - nhom 1 va thong ke t tren chuoi theo ngay (r5: lay moi 5 ngay de khong chong lan). Ca VN100-like (GTGD TB20 >= 30 ty), nua dau / nua sau cua mau.
// Cuoi: dong tien TONG THI TRUONG ngay d (tong mua - ban chu dong / tong) so voi lai VN-Index phien d+1.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson } from "./backtestChung.mjs";

const kho = JSON.parse(readFileSync(fileURLToPath(new URL("../output/dong_tien_ngay.json", import.meta.url)), "utf-8"));
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const bps = (x) => (Number.isFinite(x) ? `${(x * 1e4).toFixed(0).padStart(5)}` : "    -");

const chiSo = new Map(); // ma -> Map(ngay -> i)
const gtgd20 = new Map(); // ma -> mang
for (const [ma, b] of Object.entries(cache)) {
  chiSo.set(ma, new Map(b.map((x, i) => [x.t, i])));
  const g = [];
  let s = 0;
  for (let i = 0; i < b.length; i++) {
    s += (b[i].c * (b[i].v ?? 0)) / 1e6;
    if (i >= 20) s -= (b[i - 20].c * (b[i - 20].v ?? 0)) / 1e6;
    g.push(i >= 19 ? s / 20 : 0);
  }
  gtgd20.set(ma, g);
}
// ---------- bang cap (ma, ngay) ----------
const hang = [];
for (const [khoa, d] of Object.entries(kho)) {
  if (!d.t) continue;
  const [ma, ngay] = khoa.split("|");
  const b = cache[ma], i = chiSo.get(ma)?.get(ngay);
  if (!b || i == null || i < 1 || i + 6 >= b.length) continue;
  const tong = d.m + d.b;
  if (tong < 200 || gtgd20.get(ma)[i] < 5) continue;
  hang.push({
    ma, ngay, g: gtgd20.get(ma)[i], dr: b[i].c / b[i - 1].c - 1,
    imb: (d.m - d.b) / tong, lon: (d.lm - d.lb) / tong, nn: d.nn == null ? null : d.nn / tong,
    r1: b[i + 2].o / b[i + 1].o - 1, r5: b[i + 5].c / b[i + 1].o - 1,
  });
}
const theoNgay = new Map();
for (const x of hang) { if (!theoNgay.has(x.ngay)) theoNgay.set(x.ngay, []); theoNgay.get(x.ngay).push(x); }
const ngay = [...theoNgay.keys()].sort();
console.log(`${hang.length} cap (ma, ngay) hop le, ${ngay.length} ngay (${ngay[0]} .. ${ngay[ngay.length - 1]}), TB ${Math.round(hang.length / ngay.length)} ma / ngay\n`);

// ---------- phan du cat ngang theo ngay + tru TB ngay ----------
for (const ds of theoNgay.values()) {
  if (ds.length < 40) continue;
  const m1 = tb(ds.map((x) => x.r1)), m5 = tb(ds.map((x) => x.r5));
  for (const x of ds) { x.r1 -= m1; x.r5 -= m5; }
  for (const k of ["imb", "lon"]) {
    const mx = tb(ds.map((x) => x.dr)), my = tb(ds.map((x) => x[k]));
    const sxx = ds.reduce((s, x) => s + (x.dr - mx) ** 2, 0) || 1;
    const b = ds.reduce((s, x) => s + (x.dr - mx) * (x[k] - my), 0) / sxx;
    for (const x of ds) x[`${k}Res`] = x[k] - my - b * (x.dr - mx);
  }
}
const DAC_TRUNG = [["imb", "can bang mua-ban chu dong"], ["imbRes", "  ... phan du sau khi bo bien dong gia cung ngay"], ["lon", "lenh lon ron / tong"], ["lonRes", "  ... phan du sau khi bo bien dong gia cung ngay"], ["nn", "khoi ngoai ron / tong"]];

function nguPhanVi(tenNhom, loc, ngayDung) {
  console.log(`\n######## ${tenNhom} ########`);
  console.log(`   ${"dac trung".padEnd(46)} | Q1 (thap)  Q2    Q3    Q4   Q5 (cao) r1 bps | Q5-Q1 r1 (t)   | Q5-Q1 r5 (t, moi 5 ngay)`);
  for (const [k, ten] of DAC_TRUNG) {
    const chuoi = { r1: [], r5: [] };
    const nhomTB = [[], [], [], [], []];
    const dsNgay = ngay.filter((d) => ngayDung(d));
    dsNgay.forEach((d, idx) => {
      const ds = (theoNgay.get(d) ?? []).filter((x) => loc(x) && x[k] != null && Number.isFinite(x[k]) && x.r1 != null);
      if (ds.length < 40) return;
      const s = [...ds].sort((a, b) => a[k] - b[k]);
      const q = (i) => s.slice(Math.floor((i * s.length) / 5), Math.floor(((i + 1) * s.length) / 5));
      for (let i = 0; i < 5; i++) nhomTB[i].push(tb(q(i).map((x) => x.r1)));
      chuoi.r1.push(tb(q(4).map((x) => x.r1)) - tb(q(0).map((x) => x.r1)));
      if (idx % 5 === 0) chuoi.r5.push(tb(q(4).map((x) => x.r5)) - tb(q(0).map((x) => x.r5)));
    });
    if (chuoi.r1.length < 20) { console.log(`   ${ten.padEnd(46)} | (it ngay: ${chuoi.r1.length})`); continue; }
    const t = (a) => tb(a) / (sd(a) / Math.sqrt(a.length));
    console.log(`   ${ten.padEnd(46)} | ${nhomTB.map((a) => bps(tb(a))).join(" ")}      | ${bps(tb(chuoi.r1))} (${f(t(chuoi.r1), 1).padStart(5)}) | ${bps(tb(chuoi.r5))} (${f(t(chuoi.r5), 1).padStart(5)})  [${chuoi.r1.length} ngay]`);
  }
}
const giua = ngay[Math.floor(ngay.length / 2)];
nguPhanVi("TOAN BO mau (GTGD TB20 >= 5 ty)", () => true, () => true);
nguPhanVi("MA THANH KHOAN CAO (GTGD TB20 >= 30 ty)", (x) => x.g >= 30, () => true);
nguPhanVi("NUA DAU cua mau", () => true, (d) => d < giua);
nguPhanVi("NUA SAU cua mau", () => true, (d) => d >= giua);

// ---------- dong tien TONG THI TRUONG vs lai VN-Index ngay hom sau ----------
const vniIdx = new Map(vni.map((b, i) => [b.t, i]));
const xs = [], ys = [];
for (const d of ngay) {
  const ds = theoNgay.get(d);
  const i = vniIdx.get(d);
  if (!ds || i == null || i + 1 >= vni.length) continue;
  let m = 0, b = 0;
  for (const x of ds) { const k = kho[`${x.ma}|${d}`]; m += k.m; b += k.b; }
  xs.push((m - b) / (m + b));
  ys.push(vni[i + 1].c / vni[i].c - 1);
}
const mx = tb(xs), my = tb(ys);
const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.length - 1);
const r = cov / (sd(xs) * sd(ys));
console.log(`\n######## DONG TIEN TONG THI TRUONG ngay d vs lai VN-Index phien d+1 (${xs.length} ngay) ########`);
console.log(`   tuong quan ${f(r, 3)} (t ${f((r * Math.sqrt(xs.length - 2)) / Math.sqrt(1 - r * r), 1)}); can bang chu dong TB ${f(mx, 3)}`);
const s2 = xs.map((x, i) => [x, ys[i]]).sort((a, b) => a[0] - b[0]);
const m3 = Math.floor(s2.length / 3);
console.log(`   VN-Index d+1: nhom can bang THAP ${bps(tb(s2.slice(0, m3).map((p) => p[1])))} bps | giua ${bps(tb(s2.slice(m3, -m3).map((p) => p[1])))} | CAO ${bps(tb(s2.slice(-m3).map((p) => p[1])))} bps (moi nhom ${m3} ngay)`);
