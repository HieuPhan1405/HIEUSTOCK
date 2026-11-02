// DINH GIA RA GIA HOP LY, MUA CANG RE HON DINH GIA CANG TOT (Hieu 03/11/2026).
// Gia tri hop ly (tong von hoa) tinh tu BCTC co hieu luc quy + 50 ngay, bang 4 cach, lay TRUNG VI cac cach ap dung duoc (r = von hoa / gia tri hop ly; bien an toan = 1 - r):
//   F1 PB hop ly theo ROE (Gordon): VCSH x (ROE - g) / (k - g), k = 12%, g = 6%, ROE chan 25% (ROE cao keo dai khong ben)
//   F2 Vo thu nhap co tang truong: LN TTM x (1 + g) / (k - g), g = clamp(tang LN TTM / 2, 0%, 5%)
//   F3 So Graham: can(22,5 x LN TTM x VCSH)
//   F4 PE trung vi nganh: LN TTM x trung vi PE cac ma thanh khoan cung nganh (>= 5 ma)
// Cach nao khong ap dung duoc (LN <= 0...) thi bo; can >= 3 cach. Chi gom ma DANG niem yet; von hoa = gia dieu chinh x so CP hien tai.
// PHAN A: "cang re hon dinh gia cang tot?" - chia r thanh nhom <= 0,5 / 0,5-0,7 / 0,7-0,9 / 0,9-1,1 / > 1,1 va do loi suat 12T, 24T (TB tung thang roi TB cac thang), ro chat luong (LN > 0, ROE >= 10%, von hoa >= 2.000 ty); tach ngan hang / khong ngan hang.
// PHAN B: danh muc K = 15 ma re nhat (r thap nhat, phai r <= nguong), kiem tra moi quy, ban khi r >= 1 (da dat gia hop ly) hoac DN xau di (LN <= 0, ROE < 8%). 2022-01 -> nay, + bat dau tu 2026.
// Chay: node engine/dich-vu/nghienCuuDinhGiaRaGia.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const bctc = docJson("bctc_dai.json");
const nganh = docJson("nganh_map.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
const ma = [], C = [], G = [];
for (const [k, bars] of Object.entries(nen)) {
  if (bars.length < 300 || !SO_CP_LUU_HANH[k] || !bctc[k]) continue;
  const c = new Array(N).fill(null), g = new Array(N).fill(0);
  for (const b of bars) { const i = idx.get(b.t); if (i != null) { c[i] = b.c; g[i] = b.c * b.v; } }
  let last = null;
  for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) c[i] = last; }
  ma.push(k); C.push(c); G.push(g);
}
const M = ma.length;
const cong = (d, n) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);
const qsAll = [...new Set(ma.flatMap((k) => Object.keys(bctc[k].q)))].sort();
const lui = (q, k) => qsAll[qsAll.indexOf(q) - k];
const gtv = (b, q, it) => b.q[q]?.[it];
const ttm = (b, q, it) => { let s = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; } return s; };
const quyHieuLuc = (t) => { let q = null; for (const x of qsAll) { if (cong(x, 50) <= t) q = x; else break; } return q; };
const cacheCB = new Map();
function coBan(j, q) {
  const key = j + "|" + q;
  if (cacheCB.has(key)) return cacheCB.get(key);
  const b = bctc[ma[j]];
  const ln = ttm(b, q, 23003), q4 = lui(q, 4), ln0 = q4 ? ttm(b, q4, 23003) : NaN;
  const vcsh = (gtv(b, q, 14000) ?? NaN) + (gtv(b, q, 15000) ?? 0);
  const no = Number.isFinite(gtv(b, q, 13000)) ? gtv(b, q, 13000) : NaN;
  const lq = gtv(b, q, 23003), lq0 = q4 ? gtv(b, q4, 23003) : NaN;
  const tang = Number.isFinite(ln0) && ln0 > 0 && ln > 0 ? ln / ln0 - 1 : Number.isFinite(lq) && Number.isFinite(lq0) && lq0 > 0 ? lq / lq0 - 1 : NaN;
  const o = { ln, vcsh, roe: (ln / vcsh) * 100, donBay: no / vcsh, tang, cfo: ttm(b, q, 32000), loai: b.loai };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => i > 260 && C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const viTri = new Map(cuoiThang.map((i, p) => [i, p]));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const K_VON = 0.12, G_BEN = 0.06;

const cacheInfo = new Map();
function info(j, i0) {
  const key = j * 100000 + i0;
  if (cacheInfo.has(key)) return cacheInfo.get(key);
  let o = null;
  const q = quyHieuLuc(ngay[i0]);
  if (q && thanhKhoan(j, i0)) {
    const c = coBan(j, q), von = vonHoa(j, i0);
    if (c.vcsh > 0) o = { j, von, c, pe: c.ln > 0 ? von / c.ln : NaN, nganh: nganh[ma[j]] ?? "?", nh: c.loai === "nh", loai: c.loai };
  }
  cacheInfo.set(key, o);
  return o;
}
const cacheNg = new Map();
function peNganh(i0) {
  if (cacheNg.has(i0)) return cacheNg.get(i0);
  const g = new Map();
  for (let j = 0; j < M; j++) { const o = info(j, i0); if (o && o.pe > 0 && o.pe < 100) { const a = g.get(o.nganh) ?? []; a.push(o.pe); g.set(o.nganh, a); } }
  const m = new Map();
  for (const [k, a] of g) if (a.length >= 5) m.set(k, med(a));
  cacheNg.set(i0, m);
  return m;
}
const cacheR = new Map();
// r = von hoa / gia tri hop ly (trung vi cac cach); null neu < 3 cach
function dinhGia(j, i0) {
  const key = j * 100000 + i0;
  if (cacheR.has(key)) return cacheR.get(key);
  const o = info(j, i0);
  let kq = null;
  if (o && o.c.ln > 0) {
    const { ln, vcsh, roe, tang } = o.c;
    const fv = [];
    const roeC = Math.min(roe, 25) / 100;
    if (roeC > G_BEN) fv.push(vcsh * (roeC - G_BEN) / (K_VON - G_BEN)); // F1
    const g = Math.max(0, Math.min(0.05, Number.isFinite(tang) ? tang / 2 : 0));
    fv.push((ln * (1 + g)) / (K_VON - g)); // F2
    fv.push(Math.sqrt(22.5 * ln * vcsh)); // F3
    const mp = peNganh(i0).get(o.nganh);
    if (mp > 0) fv.push(ln * mp); // F4
    if (fv.length >= 3) kq = { r: o.von / med(fv), fv: med(fv), o };
  }
  cacheR.set(key, kq);
  return kq;
}
const R_A = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const cuoiGia = (i0, h) => { const p = viTri.get(i0) + h; return p < cuoiThang.length ? Math.min(N - 1, cuoiThang[p] + 1) : null; };

// =============== PHAN A ===============
const NHOM = [["r <= 0,5", (r) => r <= 0.5], ["0,5 - 0,7", (r) => r > 0.5 && r <= 0.7], ["0,7 - 0,9", (r) => r > 0.7 && r <= 0.9], ["0,9 - 1,1", (r) => r > 0.9 && r <= 1.1], ["> 1,1", (r) => r > 1.1]];
const QUAL = (o) => o.c.ln > 0 && o.c.roe >= 10 && o.von >= 2e12;
console.log("################ PHAN A - NHOM THEO r = GIA / GIA TRI HOP LY (ro chat luong: LN > 0, ROE >= 10%, von hoa >= 2.000 ty) ################");
for (const H of [12, 24]) {
  for (const [ten, dk] of [["tat ca", () => true], ["KHONG ngan hang", (o) => !o.nh], ["CHI ngan hang", (o) => o.nh]]) {
    console.log(`\n--- Giu ${H} thang | ${ten} --- (TB loi suat % cua tung nhom; (so thang) ; so ma TB)`);
    const hang = [];
    for (const [nhan, fn] of NHOM) {
      const bk = [], dem = [];
      for (const i0 of R_A) {
        const e = cuoiGia(i0, H);
        if (e == null || e <= i0 + 1) continue;
        const x = [];
        for (let j = 0; j < M; j++) {
          const d = dinhGia(j, i0);
          if (!d || !QUAL(d.o) || !dk(d.o) || !fn(d.r)) continue;
          x.push(C[j][e] / C[j][i0 + 1] - 1);
        }
        if (x.length >= 3) { bk.push(tb(x) * 100); dem.push(x.length); }
      }
      hang.push(`${nhan}: ${bk.length ? f(tb(bk), 1) + "% (" + bk.length + "t, " + f(tb(dem), 1) + " ma)" : "-"}`);
    }
    console.log(hang.join(" | "));
  }
}

// =============== PHAN B ===============
function chay(R, { K = 15, ngMax = 0.8, ban = 1.0, boNH = false, chiNH = false, tangMax = Infinity, rMin = 0 }) {
  const hold = new Set(), rets = [], soMa = [];
  const hopLe = (o) => o.c.ln > 0 && o.c.roe >= 10 && o.von >= 2e12 && !(boNH && o.nh) && !(chiNH && !o.nh) && !(o.c.tang > tangMax);
  let cuoi = [];
  for (let r = 0; r + 1 < R.length; r++) {
    const i0 = R[r], i1 = R[r + 1];
    let doi = 0;
    if (r === 0 || ["02", "05", "08", "11"].includes(ngay[i0].slice(5, 7))) {
      for (const j of [...hold]) { const d = dinhGia(j, i0); if (!d || !(d.o.c.ln > 0) || d.o.c.roe < 8 || d.r >= ban) { hold.delete(j); doi++; } }
      const P = [];
      for (let j = 0; j < M; j++) { const d = dinhGia(j, i0); if (d && hopLe(d.o) && d.r <= ngMax && d.r >= rMin && !hold.has(j)) P.push({ j, r: d.r }); }
      P.sort((a, b) => a.r - b.r);
      for (const x of P) { if (hold.size >= K) break; hold.add(x.j); doi++; }
    }
    let tong = 0;
    for (const j of hold) tong += C[j][i1 + 1] / C[j][i0 + 1] - 1;
    rets.push(tong / K - (0.002 * doi) / K);
    soMa.push(hold.size);
    cuoi = [...hold];
  }
  return { rets, soMa: tb(soMa), cuoi };
}
const duong = (a) => { const o = [1]; for (const x of a) o.push(o.at(-1) * (1 + x)); return o; };
const cagr = (a) => (Math.pow(duong(a).at(-1), 12 / a.length) - 1) * 100;
const sut = (a) => { let pk = 1, v = 1, m = 0; for (const x of a) { v *= 1 + x; pk = Math.max(pk, v); m = Math.min(m, v / pk - 1); } return m * 100; };
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const vr = R_A.slice(0, -1).map((i0, r) => vni[R_A[r + 1] + 1].c / vni[i0 + 1].c - 1);
const nam = [...new Set(R_A.slice(0, -1).map((i) => ngay[i].slice(0, 4)))];
const theoNam = (a) => nam.map((y) => { const q = R_A.slice(0, -1).map((i, k) => (ngay[i].startsWith(y) ? k : -1)).filter((k) => k >= 0); return (duong(q.map((k) => a[k])).at(-1) - 1) * 100; });
console.log(`\n\n################ PHAN B - DANH MUC MUA CANG RE CANG TOT (K = 15, kiem tra moi quy), ${vr.length} thang ${ngay[R_A[0]]} -> ${ngay[R_A.at(-1)]} ################`);
console.log("Cach".padEnd(58), "CAGR".padStart(6), "sut".padStart(5), "t vuot".padStart(7), "ma TB".padStart(6), "|", nam.map((y) => y.slice(2).padStart(4)).join(" "));
const in1 = (ten, k) => { const ex = k.rets.map((x, i) => x - vr[i]); const t = sd(ex) > 0 ? tb(ex) / (sd(ex) / Math.sqrt(ex.length)) : NaN; console.log(ten.padEnd(58), f(cagr(k.rets), 1).padStart(6), f(sut(k.rets), 0).padStart(5), (Number.isFinite(t) ? f(t, 2) : "-").padStart(7), (Number.isFinite(k.soMa) ? f(k.soMa, 1) : "-").padStart(6), "|", theoNam(k.rets).map((x) => f(x, 0).padStart(4)).join(" ")); };
in1("VN-Index", { rets: vr, soMa: NaN });
for (const [ten, tuyChon] of [
  ["Re nhat, r <= 0,8, ban khi r >= 1,0", {}],
  ["  yeu cau re hon: r <= 0,6", { ngMax: 0.6 }],
  ["  yeu cau re hon: r <= 0,5", { ngMax: 0.5 }],
  ["  chi r <= 1,0 (mua moi duoi gia hop ly)", { ngMax: 1.0 }],
  ["  ban khi r >= 1,2 (giu lau hon)", { ban: 1.2 }],
  ["  ban khi r >= 0,9", { ban: 0.9 }],
  ["  K = 10", { K: 10 }], ["  K = 25", { K: 25 }],
  ["KHONG ngan hang, r <= 0,8", { boNH: true }],
  ["CHI ngan hang, r <= 0,8", { chiNH: true }],
  ["LOAI LN TTM tang > 100% (loi nhuan bat thuong)", { tangMax: 1.0 }],
  ["LOAI LN tang > 100% + KHONG ngan hang", { tangMax: 1.0, boNH: true }],
  ["CHI r tu 0,5 den 0,8 (khong qua re)", { rMin: 0.5 }],
  ["CHI r tu 0,5 den 0,8 + loai LN tang > 100%", { rMin: 0.5, tangMax: 1.0 }],
  ["CHI r tu 0,5 den 0,8 + loai LN tang > 100% + KHONG ngan hang", { rMin: 0.5, tangMax: 1.0, boNH: true }],
]) in1(ten, chay(R_A, tuyChon));
// bat dau tu 2026
{
  let iG = N - 1; while (iG > 0 && nen.FPT.at(-1).t < ngay[iG]) iG--;
  const R26 = [...cuoiThang.filter((i) => ngay[i] >= "2025-12-01" && i < iG - 1), iG - 1];
  const v26 = R26.slice(0, -1).map((i0, r) => vni[R26[r + 1] + 1].c / vni[i0 + 1].c - 1);
  const tong = (a) => (duong(a).at(-1) - 1) * 100;
  console.log(`\n--- Bat dau ${ngay[R26[0] + 1]} -> ${ngay[iG]}: VN-Index ${f(tong(v26), 1)}% ---`);
  for (const [ten, tuyChon] of [["r <= 0,8, ban khi r >= 1,0", {}], ["r <= 0,6", { ngMax: 0.6 }], ["KHONG ngan hang", { boNH: true }]]) {
    const k = chay(R26, tuyChon);
    console.log(ten.padEnd(30), f(tong(k.rets), 1) + "%", "| sut", f(sut(k.rets), 0) + "% |", k.cuoi.map((j) => `${ma[j]} ${f((C[j][iG] / C[j][R26[0] + 1] - 1) * 100, 0)}%`).join(" "));
  }
  // PNJ, DGC, FPT tai 31/12/2025 va hom nay
  for (const k of ["PNJ", "DGC", "FPT", "BMP"]) {
    const j = ma.indexOf(k), a = dinhGia(j, R26[0]), b = dinhGia(j, cuoiThang.filter((i) => i <= iG).at(-1));
    console.log(`${k}: r 31/12/2025 = ${a ? f(a.r, 2) : "-"} | r gan day = ${b ? f(b.r, 2) : "-"}`);
  }
  // danh sach hien tai
  const iNow = cuoiThang.filter((i) => i <= iG).at(-1);
  const P = [];
  for (let j = 0; j < M; j++) { const d = dinhGia(j, iNow); if (d && QUAL(d.o) && d.r <= 0.8) P.push({ j, r: d.r, d }); }
  P.sort((a, b) => a.r - b.r);
  console.log(`\n--- DANH SACH HIEN TAI (${ngay[iNow]}, BCTC quy ${quyHieuLuc(ngay[iNow])}): ${P.length} ma co r <= 0,8 (chat luong: LN > 0, ROE >= 10%, von hoa >= 2.000 ty); 20 ma re nhat ---`);
  const dinh = (j) => { let m = 0; for (let k = iNow - 251; k <= iNow; k++) m = Math.max(m, C[j][k]); return m; };
  for (const x of P.slice(0, 20)) console.log(`${ma[x.j].padEnd(5)} r ${f(x.r, 2)} (gia = ${f(x.r * 100, 0)}% gia hop ly) | ${x.d.o.loai.padEnd(2)} | ${String(x.d.o.nganh).padEnd(18).slice(0, 18)} | ROE ${f(x.d.o.c.roe, 1)}% | LN TTM ${Number.isFinite(x.d.o.c.tang) ? f(x.d.o.c.tang * 100, 0) + "%" : "-"} | cach dinh 1 nam ${f((C[x.j][iNow] / dinh(x.j) - 1) * 100, 0)}%`);
}
