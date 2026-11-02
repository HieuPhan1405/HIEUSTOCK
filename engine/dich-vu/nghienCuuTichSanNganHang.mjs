// TICH SAN CHI GOM NGAN HANG (Hieu 03/11/2026: "neu tich san chi ngan hang thi sao").
// Ngan hang = ma loai "nh" trong bctc_dai.json. Cac cach chon (moi thang tai can bang chia deu, phi 0,2%/chieu; xem them cam KHONG DOI tu mot moc bat dau):
//   NH_TOP8   8 ngan hang von hoa lon nhat (thanh khoan);   NH_TATCA  moi ngan hang thanh khoan;
//   NH_LOC8   8 ngan hang lon nhat dat bo loc tich san (ROE >= 12%, LN TTM tang >= 5%) - chi tu 2022 (can BCTC);
//   NH_RE8    8 ngan hang PB thap nhat trong so dat ROE >= 12%;   NH_ROE8  8 ngan hang ROE cao nhat.
// DOI CHUNG: VN-Index; TICH SAN day du (nhu nghienCuuPhongCachDauTu.mjs: von hoa >= 20.000 ty, an toan tai chinh); TICH SAN KHONG NGAN HANG (cung bo loc, chi ma loai "pi");
//   NH_TOP8 tu 2014 chi dung gia (von hoa = gia x so CP HIEN TAI -> thien lech nhin truoc + nguoi song sot).
// Chay: node engine/dich-vu/nghienCuuTichSanNganHang.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const bctc = docJson("bctc_dai.json");
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
const LOAI_NGANH = process.argv[2] || "nh"; // "nh" ngan hang (mac dinh), "ck" chung khoan, "bh" bao hiem - doi tham so de test cung bo cach chon cho nganh khac (ten NH_* giu nguyen)
const laNH = ma.map((k) => bctc[k].loai === LOAI_NGANH);
console.log(`${M} ma co BCTC, ${laNH.filter(Boolean).length} ngan hang: ${ma.filter((_, j) => laNH[j]).join(" ")}`);
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
  const tang = Number.isFinite(ln0) && ln0 > 0 && ln > 0 ? ln / ln0 - 1 : Number.isFinite(lq) && Number.isFinite(lq0) && lq >= lq0 ? 0.05 : -1;
  const o = { ln, vcsh, roe: (ln / vcsh) * 100, donBay: no / vcsh, tang, cfo: ttm(b, q, 32000), tsnh: gtv(b, q, 11000), nnh: gtv(b, q, 13100) };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => i > 260 && C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const sx = (a, key, tang = true) => [...a].sort((x, y) => (tang ? key(x) - key(y) : key(y) - key(x)));

// ---- cac cach chon (tra danh sach da xep hang) ----
const nhThanhKhoan = (i0) => { const a = []; for (let j = 0; j < M; j++) if (laNH[j] && thanhKhoan(j, i0)) a.push({ j, von: vonHoa(j, i0) }); return a; };
const cb = (i0, x) => { const q = quyHieuLuc(ngay[i0]); return q ? coBan(x.j, q) : null; };
const POOL = {
  NH_TOP8: (i0) => sx(nhThanhKhoan(i0), (x) => x.von, false),
  NH_TATCA: (i0) => sx(nhThanhKhoan(i0), (x) => x.von, false),
  NH_LOC8: (i0) => sx(nhThanhKhoan(i0).filter((x) => { const c = cb(i0, x); return c && c.ln > 0 && c.roe >= 12 && c.tang >= 0.05; }), (x) => x.von, false),
  NH_RE8: (i0) => sx(nhThanhKhoan(i0).map((x) => ({ ...x, c: cb(i0, x) })).filter((x) => x.c && x.c.ln > 0 && x.c.roe >= 12), (x) => x.von / x.c.vcsh),
  NH_ROE8: (i0) => sx(nhThanhKhoan(i0).map((x) => ({ ...x, c: cb(i0, x) })).filter((x) => x.c && x.c.ln > 0), (x) => x.c.roe, false),
  TICH_SAN: (i0) => tichSan(i0, false),
  TICH_SAN_KHONG_NH: (i0) => tichSan(i0, true),
};
function tichSan(i0, boNH) {
  const q = quyHieuLuc(ngay[i0]);
  const out = [];
  if (!q) return out;
  for (let j = 0; j < M; j++) {
    if (!thanhKhoan(j, i0)) continue;
    const b = bctc[ma[j]];
    if (boNH && b.loai !== "pi") continue;
    const c = coBan(j, q), von = vonHoa(j, i0);
    if (!(c.ln > 0) || von < 2e13 || c.roe < 12 || c.tang < 0.05) continue;
    if (b.loai === "pi" && (!(c.cfo > 0) || c.donBay > 2.5 || !(c.tsnh / c.nnh >= 1))) continue;
    out.push({ j, von });
  }
  return sx(out, (x) => x.von, false);
}

// ---- tai can bang hang thang ----
function chay(pool, K, R) {
  const hold = new Set(), rets = [], dem = [];
  for (let r = 0; r + 1 < R.length; r++) {
    const i0 = R[r], i1 = R[r + 1];
    const P = pool(i0).slice(0, K), topK = new Set(P.map((x) => x.j));
    let doi = 0;
    for (const j of [...hold]) if (!topK.has(j)) { hold.delete(j); doi++; }
    for (const x of P) if (!hold.has(x.j)) { hold.add(x.j); doi++; }
    let tong = 0;
    for (const j of hold) tong += C[j][i1 + 1] / C[j][i0 + 1] - 1;
    rets.push(tong / K - (0.002 * doi) / K);
    dem.push(hold.size);
  }
  return { rets, soMa: tb(dem) };
}
const duong = (a) => { const o = [1]; for (const x of a) o.push(o.at(-1) * (1 + x)); return o; };
const cagr = (a) => (Math.pow(duong(a).at(-1), 12 / a.length) - 1) * 100;
const sut = (a) => { let pk = 1, v = 1, m = 0; for (const x of a) { v *= 1 + x; pk = Math.max(pk, v); m = Math.min(m, v / pk - 1); } return m * 100; };
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };

function bang(tieuDe, R, dong) {
  const vr = R.slice(0, -1).map((i0, r) => vni[R[r + 1] + 1].c / vni[i0 + 1].c - 1);
  const nam = [...new Set(R.slice(0, -1).map((i) => ngay[i].slice(0, 4)))];
  const theoNam = (a) => nam.map((y) => { const q = R.slice(0, -1).map((i, k) => (ngay[i].startsWith(y) ? k : -1)).filter((k) => k >= 0); return (duong(q.map((k) => a[k])).at(-1) - 1) * 100; });
  console.log(`\n=================== ${tieuDe}: ${vr.length} thang (${ngay[R[0]]} -> ${ngay[R.at(-1)]}) ===================`);
  console.log("Cach".padEnd(44), "CAGR".padStart(6), "sut".padStart(5), "t vuot".padStart(7), "ma TB".padStart(6), "|", nam.map((y) => y.slice(2).padStart(4)).join(" "));
  const in1 = (ten, rets, soMa) => {
    const ex = rets.map((x, i) => x - vr[i]);
    const t = sd(ex) > 0 && ten !== "VN-Index" ? tb(ex) / (sd(ex) / Math.sqrt(ex.length)) : NaN;
    console.log(ten.padEnd(44), f(cagr(rets), 1).padStart(6), f(sut(rets), 0).padStart(5), (Number.isFinite(t) ? f(t, 2) : "-").padStart(7), (Number.isFinite(soMa) ? f(soMa, 1) : "-").padStart(6), "|", theoNam(rets).map((x) => f(x, 0).padStart(4)).join(" "));
  };
  in1("VN-Index", vr, NaN);
  for (const [ten, pool, K] of dong) { const r = chay(pool, K, R); in1(ten, r.rets, r.soMa); }
}

const R_A = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
bang("NHOM A (co BCTC) 2022 -> nay", R_A, [
  ["NH_TOP8   8 ngan hang lon nhat", POOL.NH_TOP8, 8],
  ["NH_TATCA  moi ngan hang thanh khoan", POOL.NH_TATCA, 40],
  ["NH_LOC8   8 NH lon nhat dat loc tich san", POOL.NH_LOC8, 8],
  ["NH_RE8    8 NH PB thap nhat (ROE >= 12%)", POOL.NH_RE8, 8],
  ["NH_ROE8   8 NH ROE cao nhat", POOL.NH_ROE8, 8],
  ["Tich san day du (15 ma)", POOL.TICH_SAN, 15],
  ["Tich san KHONG ngan hang", POOL.TICH_SAN_KHONG_NH, 15],
]);
const R_B = cuoiThang.filter((i) => ngay[i] >= "2014-01-01" && i + 2 < N);
bang("NHOM B (chi gia) 2014 -> nay", R_B, [
  ["NH_TOP8   8 ngan hang lon nhat", POOL.NH_TOP8, 8],
  ["NH_TATCA  moi ngan hang thanh khoan", POOL.NH_TATCA, 40],
]);

// ---- cam khong doi tu mot moc bat dau ----
console.log("\n=================== CAM KHONG DOI tu cuoi thang bat dau (8 ngan hang lon nhat / ca ro tich san), den phien gia moi nhat ===================");
let iG = N - 1;
while (iG > 0 && nen.FPT.at(-1).t < ngay[iG]) iG--;
console.log("Bat dau".padEnd(14), "NH top8".padStart(9), "NH tat ca".padStart(10), "Tich san".padStart(9), "TS khong NH".padStart(12), "VN-Index".padStart(9));
for (const s of ["2019-12-31", "2020-12-31", "2021-12-31", "2022-12-30", "2023-12-29", "2024-12-31", "2025-12-31"]) {
  const i0 = ngay.indexOf(s);
  if (i0 < 0) continue;
  const gia = (p, K) => { const P = p(i0).slice(0, K); return P.length ? (tb(P.map((x) => C[x.j][iG] / C[x.j][i0 + 1])) - 1) * 100 : NaN; };
  const v = (vni[iG].c / vni[i0 + 1].c - 1) * 100;
  const cell = (x) => (Number.isFinite(x) ? f(x, 0) + "%" : "-");
  console.log(s.padEnd(14), cell(gia(POOL.NH_TOP8, 8)).padStart(9), cell(gia(POOL.NH_TATCA, 40)).padStart(10), cell(gia(POOL.TICH_SAN, 15)).padStart(9), cell(gia(POOL.TICH_SAN_KHONG_NH, 15)).padStart(12), cell(v).padStart(9));
}

// ---- hien tai: 8 ngan hang lon nhat, PB, ROE, cach dinh ----
console.log(`\n=================== NGAN HANG HIEN TAI (gia ${ngay[iG]}) ===================`);
const q = quyHieuLuc(ngay[N - 1]);
const dinh = (j) => { let m = 0; for (let k = iG - 251; k <= iG; k++) m = Math.max(m, C[j][k]); return m; };
for (const x of POOL.NH_TOP8(iG).slice(0, 14)) {
  const c = coBan(x.j, q), von = vonHoa(x.j, iG);
  console.log(`${ma[x.j].padEnd(5)} von hoa ${f(von / 1e12, 0).padStart(4)}k ty | PB ${f(von / c.vcsh, 2)} | PE ${f(von / c.ln, 1)} | ROE ${f(c.roe, 1)}% | LN TTM ${c.tang > -1 ? f(c.tang * 100, 0) + "%" : "-"} | cach dinh 1 nam ${f((C[x.j][iG] / dinh(x.j) - 1) * 100, 0)}% | loc tich san ${c.roe >= 12 && c.tang >= 0.05 ? "dat" : "khong"}`);
}
