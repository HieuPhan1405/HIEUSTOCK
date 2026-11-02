// PHUONG PHAP DAU TU DAI HAN CUA CAC NHA DAU TU NOI TIENG, CHUYEN THANH QUY TAC VA TEST TREN TT VN (Hieu 03/11/2026).
// Khung chung: cuoi thang dau tien mua toi da K = 15 ma chia deu; sau do CHI KIEM TRA MOI QUY (cuoi thang 2, 5, 8, 11 - sau han nop BCTC quy + 50 ngay):
//   ban ma vi pham "dieu kien ban" cua phuong phap, mua ma moi xep hang cao nhat cho du K. Giua cac lan kiem tra: giu nguyen. O trong = tien mat 0%. Phi 0,2%/chieu.
//   BCTC (bctc_dai.json) co hieu luc sau quy + 50 ngay; von hoa = gia dieu chinh x so CP hien tai (xap xi); chi gom ma DANG niem yet (thien lech nguoi song sot).
// Nhom A (can BCTC, 2022-01 -> nay):
//   GRAHAM  "Nha dau tu phong thu": von hoa >= 5.000 ty; (phi tai chinh) thanh toan hien hanh >= 1,5 va vay dai han <= von luu dong; LN duong moi quy (8 quy gan nhat co du lieu);
//           co tra co tuc tien mat 4 quy qua; LN 12 thang khong giam; PE <= 15 va PE x PB <= 22,5. Xep: PE x PB thap nhat. Ban: het dat bo loc.
//   BUFFETT "Doanh nghiep tuyet voi gia hop ly": von hoa >= 5.000 ty; ROE >= 15% ca hien tai lan 1 nam truoc; LN khong giam; PE <= 20; (phi tai chinh) vay / VCSH <= 0,8 va CFO > 0.
//           Xep: ROE cao nhat. Ban CHI khi doanh nghiep xau di (ROE < 12% hoac LN giam > 20% hoac lo) - khong ban vi gia.
//   GREENBLATT "Cong thuc ky dieu" (phi tai chinh, von hoa >= 1.000 ty): EBIT = LNTT + lai vay (TTM); xep hang tong (EBIT / EV) + (EBIT / (von luu dong + TSCD)). Ban: rot khoi top 45.
//   LYNCH   "GARP": von hoa >= 2.000 ty; LN 12 thang tang 15-50%, quy gan nhat tang; PE <= 20; PEG = PE / tang truong <= 1; (phi tai chinh) vay / VCSH <= 1. Xep: PEG thap nhat.
//           Ban: tang truong < 10% hoac PEG > 2 hoac lo.
//   PIOTROSKI (phi tai chinh, von hoa >= 1.000 ty): 30% ma co PB thap nhat, diem F (9 tieu chi, so quy cung ky) >= 7. Xep: F cao, PB thap. Ban: F <= 5 hoac PB ra khoi nua thap.
//   CO TUC  (Dogs / O'Shaughnessy): von hoa >= 5.000 ty, LN duong, ty le chi tra tien mat <= 100% LN. Xep: ty suat co tuc tien mat cao nhat. Ban: rot khoi top 45 hoac lo.
//   TICH SAN (cach cua minh, de so sanh): von hoa >= 20.000 ty, ROE >= 12%, LN tang >= 5%, an toan tai chinh. Ban: het dat bo loc.
// Nhom B (chi can gia, 2014-01 -> nay, dai hon): BOGLE (VN-Index), FABER (giu VN-Index khi tren trung binh 10 thang, nguoc lai tien mat; xet moi thang),
//   HAUGEN it bien dong (15 ma von hoa >= 5.000 ty co do lech chuan 250 phien thap nhat; ban khi rot khoi top 45), 15 ma von hoa lon nhat.
// Chay: node engine/dich-vu/nghienCuuNhaDauTuNoiTieng.mjs
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
  if (bars.length < 300 || !SO_CP_LUU_HANH[k]) continue;
  const c = new Array(N).fill(null), g = new Array(N).fill(0);
  for (const b of bars) { const i = idx.get(b.t); if (i != null) { c[i] = b.c; g[i] = b.c * b.v; } }
  let last = null;
  for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) c[i] = last; }
  ma.push(k); C.push(c); G.push(g);
}
const M = ma.length;
const cong = (d, n) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);
const qsAll = [...new Set(Object.values(bctc).flatMap((b) => Object.keys(b.q)))].sort();
const lui = (q, k) => (q ? qsAll[qsAll.indexOf(q) - k] : undefined);
const gtv = (b, q, it) => (q ? b.q[q]?.[it] : undefined);
const ttm = (b, q, it) => { let s = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; } return s; };
const ttm0 = (b, q, it) => { let s = 0, co = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (Number.isFinite(x)) { s += x; co++; } } return co ? s : NaN; };
const quyHieuLuc = (t) => { let q = null; for (const x of qsAll) { if (cong(x, 50) <= t) q = x; else break; } return q; };
const so = (x) => (Number.isFinite(x) ? x : 0);

// ---------- chi so co ban 1 ma tai 1 quy ----------
const cacheCB = new Map();
function coBan(j, q) {
  const key = j + "|" + q;
  if (cacheCB.has(key)) return cacheCB.get(key);
  const b = bctc[ma[j]];
  let o = null;
  if (b && q) {
    const q4 = lui(q, 4);
    const g = (it, qq = q) => gtv(b, qq, it);
    const vcsh = so(g(14000)) + so(g(15000)), vcsh4 = so(g(14000, q4)) + so(g(15000, q4));
    const ln = ttm(b, q, 23003), ln0 = ttm(b, q4, 23003);
    const lnq = g(23003), lnq4 = g(23003, q4);
    let lnTang = Number.isFinite(ln0) && ln0 > 0 && ln > 0 ? ln / ln0 - 1 : NaN;
    if (!Number.isFinite(lnTang) && Number.isFinite(lnq) && Number.isFinite(lnq4) && lnq4 > 0) lnTang = lnq / lnq4 - 1;
    let quyDuong = 0, quyCo = 0;
    for (let k = 0; k < 8; k++) { const x = g(23003, lui(q, k)); if (Number.isFinite(x)) { quyCo++; if (x > 0) quyDuong++; } }
    const vay = so(g(13110)) + so(g(13340));
    // diem F Piotroski - so QUY gan nhat voi cung quy nam truoc (du lieu co tu 2020-12)
    let F = null;
    if (b.loai === "pi" && Number.isFinite(lnq) && Number.isFinite(lnq4) && g(12700) > 0 && g(12700, q4) > 0) {
      const ts = g(12700), ts4 = g(12700, q4);
      const roa = lnq / ts, roa4 = lnq4 / ts4;
      const cfoq = g(32000);
      const tl = (x, y) => (Number.isFinite(x) && Number.isFinite(y) && y !== 0 ? x / y : NaN);
      const cr = tl(g(11000), g(13100)), cr4 = tl(g(11000, q4), g(13100, q4));
      const bg = tl(g(23100), g(21001)), bg4 = tl(g(23100, q4), g(21001, q4));
      const vq = tl(g(21001), ts), vq4 = tl(g(21001, q4), ts4);
      const dh = so(g(13340)) / ts, dh4 = so(g(13340, q4)) / ts4;
      F = (roa > 0) + (cfoq > 0) + (roa > roa4) + (cfoq > lnq) + (dh <= dh4) + (cr > cr4) + (so(g(14110)) <= so(g(14110, q4)) * 1.001) + (bg > bg4) + (vq > vq4);
    }
    o = {
      tc: b.loai !== "pi", ln, vcsh, roe: (ln / vcsh) * 100, roe4: (ln0 / vcsh4) * 100, lnTang, lnq, lnq4, quyDuong, quyCo,
      tsnh: g(11000), nnh: g(13100), vayDH: so(g(13340)), vay, tien: so(g(11100)), tscd: so(g(12200)),
      ebit: ttm(b, q, 23800) + so(ttm0(b, q, 22510)), cfo: ttm(b, q, 32000), coTuc: -so(ttm0(b, q, 33600)), F, no: g(13000),
    };
  }
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => i > 260 && C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
// danh sach ma thanh khoan + chi so tai cuoi thang i0 (co BCTC)
const cacheDS = new Map();
function dsCoBan(i0) {
  if (cacheDS.has(i0)) return cacheDS.get(i0);
  const q = quyHieuLuc(ngay[i0]);
  const out = [];
  if (q) for (let j = 0; j < M; j++) {
    if (!thanhKhoan(j, i0) || !bctc[ma[j]]) continue;
    const cb = coBan(j, q);
    if (!cb) continue;
    const von = vonHoa(j, i0);
    out.push({ j, von, cb, pe: cb.ln > 0 ? von / cb.ln : NaN, pb: cb.vcsh > 0 ? von / cb.vcsh : NaN });
  }
  cacheDS.set(i0, out);
  return out;
}
const xep = (a, key, tang = true) => [...a].sort((x, y) => (tang ? key(x) - key(y) : key(y) - key(x)));

// ---------- cac phuong phap: pool(i0) -> danh sach DA XEP HANG [{j,...}], ban(j, i0, ctx) -> true neu ban ----------
const datGraham = (x) => {
  const c = x.cb;
  if (x.von < 5e12 || !(c.ln > 0) || !(x.pe <= 15) || !(x.pe * x.pb <= 22.5)) return false;
  if (!c.tc && (!(c.tsnh / c.nnh >= 1.5) || c.vayDH > c.tsnh - c.nnh)) return false;
  if (c.quyCo < 4 || c.quyDuong < c.quyCo) return false;
  if (!(c.coTuc > 0)) return false;
  return Number.isFinite(c.lnTang) && c.lnTang >= 0;
};
const datBuffett = (x) => {
  const c = x.cb;
  if (x.von < 5e12 || !(c.ln > 0) || !(c.roe >= 15) || !(c.roe4 >= 15) || !(c.lnTang >= 0) || !(x.pe <= 20)) return false;
  if (!c.tc && (!(c.vay / c.vcsh <= 0.8) || !(c.cfo > 0))) return false;
  return true;
};
const xauBuffett = (c) => !(c.ln > 0) || c.roe < 12 || c.lnTang < -0.2;
function magic(i0) {
  const a = dsCoBan(i0).filter((x) => !x.cb.tc && x.von >= 1e12 && x.cb.ebit > 0).map((x) => {
    const c = x.cb, ev = x.von + c.vay - c.tien, von = so(c.tsnh) - so(c.nnh) + c.tscd;
    return { ...x, ey: ev > 0 ? c.ebit / ev : NaN, roc: von > 0 ? c.ebit / von : NaN };
  }).filter((x) => Number.isFinite(x.ey) && Number.isFinite(x.roc));
  const r1 = new Map(xep(a, (x) => x.ey, false).map((x, r) => [x.j, r]));
  const r2 = new Map(xep(a, (x) => x.roc, false).map((x, r) => [x.j, r]));
  return xep(a, (x) => r1.get(x.j) + r2.get(x.j));
}
const datLynch = (x) => {
  const c = x.cb, g = c.lnTang * 100;
  if (x.von < 2e12 || !(c.ln > 0) || !(g >= 15 && g <= 50) || !(c.lnq > c.lnq4) || !(x.pe <= 20) || !(x.pe / g <= 1)) return false;
  return c.tc || c.vay / c.vcsh <= 1;
};
function piotroski(i0) {
  const a = dsCoBan(i0).filter((x) => !x.cb.tc && x.von >= 1e12 && x.pb > 0 && x.cb.F != null);
  const s = xep(a, (x) => x.pb);
  const nguong30 = s[Math.floor(s.length * 0.3)]?.pb ?? 0, nguong50 = s[Math.floor(s.length * 0.5)]?.pb ?? 0;
  return { ds: xep(s.filter((x) => x.pb <= nguong30 && x.cb.F >= 7), (x) => -x.cb.F * 100 + x.pb), nguong50 };
}
function coTuc(i0) {
  return xep(dsCoBan(i0).filter((x) => x.von >= 5e12 && x.cb.ln > 0 && x.cb.coTuc > 0 && x.cb.coTuc <= x.cb.ln), (x) => x.cb.coTuc / x.von, false);
}
const datTichSan = (x) => {
  const c = x.cb;
  if (x.von < 2e13 || !(c.ln > 0) || !(c.roe >= 12) || !(c.lnTang >= 0.05)) return false;
  return c.tc || (c.cfo > 0 && c.no / c.vcsh <= 2.5 && c.tsnh / c.nnh >= 1);
};
const doLech = (j, i) => { const r = []; for (let k = i - 249; k <= i; k++) r.push(Math.log(C[j][k] / C[j][k - 1])); const m = tb(r); return Math.sqrt(tb(r.map((x) => (x - m) ** 2))); };
function itBienDong(i0) {
  const a = [];
  for (let j = 0; j < M; j++) if (thanhKhoan(j, i0) && C[j][i0 - 251] != null && vonHoa(j, i0) >= 5e12) a.push({ j, v: doLech(j, i0) });
  return xep(a, (x) => x.v);
}
function lonNhat(i0) {
  const a = [];
  for (let j = 0; j < M; j++) if (thanhKhoan(j, i0)) a.push({ j, v: vonHoa(j, i0) });
  return xep(a, (x) => x.v, false);
}
const theoMa = (ds) => new Map(ds.map((x, r) => [x.j, { ...x, hang: r }]));

const PP = {
  GRAHAM: { ten: "Graham - nha dau tu phong thu", pool: (i0) => dsCoBan(i0).filter(datGraham).sort((a, b) => a.pe * a.pb - b.pe * b.pb), ban: (j, ctx) => !ctx.theo.has(j) },
  BUFFETT: { ten: "Buffett - DN tuyet voi, gia hop ly", pool: (i0) => xep(dsCoBan(i0).filter(datBuffett), (x) => x.cb.roe, false), ban: (j, ctx) => { const x = ctx.tatCa.get(j); return !x || xauBuffett(x.cb); } },
  GREENBLATT: { ten: "Greenblatt - cong thuc ky dieu", pool: magic, ban: (j, ctx) => !(ctx.theo.get(j)?.hang < 45) },
  LYNCH: { ten: "Lynch - tang truong gia hop ly (GARP)", pool: (i0) => xep(dsCoBan(i0).filter(datLynch), (x) => x.pe / (x.cb.lnTang * 100)), ban: (j, ctx) => { const x = ctx.tatCa.get(j); if (!x) return true; const g = x.cb.lnTang * 100; return !(x.cb.ln > 0) || !(g >= 10) || x.pe / g > 2; } },
  PIOTROSKI: { ten: "Piotroski - re + diem F cao", pool: (i0) => piotroski(i0).ds, ban: (j, ctx) => { const x = ctx.tatCa.get(j); return !x || x.cb.F == null || x.cb.F <= 5 || !(x.pb <= piotroski(ctx.i0).nguong50); } },
  CO_TUC: { ten: "Co tuc cao (Dogs / O'Shaughnessy)", pool: coTuc, ban: (j, ctx) => { const x = ctx.tatCa.get(j); return !x || !(x.cb.ln > 0) || !(ctx.theo.get(j)?.hang < 45); } },
  TICH_SAN: { ten: "Tich san (cach cua minh)", pool: (i0) => xep(dsCoBan(i0).filter(datTichSan), (x) => x.von, false), ban: (j, ctx) => !ctx.theo.has(j) },
  HAUGEN: { ten: "Haugen - it bien dong", pool: itBienDong, ban: (j, ctx) => !(ctx.theo.get(j)?.hang < 45) },
  LON_NHAT: { ten: "15 ma von hoa lon nhat", pool: lonNhat, ban: (j, ctx) => !(ctx.theo.get(j)?.hang < 30) },
};

// ---------- dong co: kiem tra moi quy ----------
const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const thangKiemTra = (i0) => ["02", "05", "08", "11"].includes(ngay[i0].slice(5, 7));
function chay(pp, R, K = 15) {
  const hold = new Set();
  const rets = [], soMa = [], tyLeTC = [];
  let doiTong = 0;
  for (let r = 0; r + 1 < R.length; r++) {
    const i0 = R[r], i1 = R[r + 1];
    let doi = 0;
    if (r === 0 || thangKiemTra(i0)) {
      const P = pp.pool(i0);
      const ctx = { i0, theo: theoMa(P), tatCa: theoMa(dsCoBan(i0)) };
      for (const j of [...hold]) if (pp.ban(j, ctx)) { hold.delete(j); doi++; }
      for (const x of P) { if (hold.size >= K) break; if (!hold.has(x.j)) { hold.add(x.j); doi++; } }
    }
    let tong = 0;
    for (const j of hold) tong += C[j][i1 + 1] / C[j][i0 + 1] - 1;
    rets.push(tong / K - (0.002 * doi) / K);
    soMa.push(hold.size);
    tyLeTC.push(hold.size ? [...hold].filter((j) => bctc[ma[j]] && bctc[ma[j]].loai !== "pi").length / hold.size : 0);
    doiTong += doi;
  }
  return { rets, soMa: tb(soMa), tc: tb(tyLeTC), quayVong: doiTong / 2 / K / (rets.length / 12), cuoi: [...hold] };
}
function faber(R) {
  const rets = [];
  let trong = null;
  for (let r = 0; r + 1 < R.length; r++) {
    const i0 = R[r], i1 = R[r + 1];
    const p = cuoiThang.indexOf(i0);
    const tb10 = tb(cuoiThang.slice(p - 9, p + 1).map((i) => vni[i].c));
    const moi = vni[i0].c > tb10;
    const phi = trong !== null && moi !== trong ? 0.002 : 0;
    trong = moi;
    rets.push((moi ? vni[i1 + 1].c / vni[i0 + 1].c - 1 : 0) - phi);
  }
  return { rets, soMa: NaN, tc: NaN, quayVong: NaN };
}

const duong = (a) => { const o = [1]; for (const x of a) o.push(o.at(-1) * (1 + x)); return o; };
const cagr = (a) => (Math.pow(duong(a).at(-1), 12 / a.length) - 1) * 100;
const sut = (a) => { let pk = 1, v = 1, m = 0; for (const x of a) { v *= 1 + x; pk = Math.max(pk, v); m = Math.min(m, v / pk - 1); } return m * 100; };
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
function bang(tieuDe, R, dsPP) {
  const vr = R.slice(0, -1).map((i0, r) => vni[R[r + 1] + 1].c / vni[i0 + 1].c - 1);
  const nam = [...new Set(R.slice(0, -1).map((i) => ngay[i].slice(0, 4)))];
  const theoNam = (a) => nam.map((y) => { const q = R.slice(0, -1).map((i, k) => (ngay[i].startsWith(y) ? k : -1)).filter((k) => k >= 0); return (duong(q.map((k) => a[k])).at(-1) - 1) * 100; });
  const cuaSo = (a, w) => { let hon = 0, tong = 0, xau = Infinity; for (let s = 0; s + w <= a.length; s++) { const x = duong(a.slice(s, s + w)).at(-1), v = duong(vr.slice(s, s + w)).at(-1); tong++; if (x > v) hon++; xau = Math.min(xau, x); } return { hon, tong, xau }; };
  console.log(`\n=================== ${tieuDe}: ${vr.length} thang (${ngay[R[0]]} -> ${ngay[R.at(-1)]}) ===================`);
  console.log("Phuong phap".padEnd(40), "CAGR".padStart(6), "sut".padStart(5), "t vuot".padStart(7), "24T>VNI".padStart(8), "24T xau".padStart(8), "ma TB".padStart(6), "%TC".padStart(5), "quay/nam".padStart(9), "|", nam.map((y) => y.slice(2)).join("   "));
  const dong = (ten, k) => {
    const ex = k.rets.map((x, i) => x - vr[i]);
    const t = sd(ex) > 0 ? tb(ex) / (sd(ex) / Math.sqrt(ex.length)) : NaN;
    const w = cuaSo(k.rets, 24);
    console.log(ten.padEnd(40), f(cagr(k.rets), 1).padStart(6), f(sut(k.rets), 0).padStart(5), (Number.isFinite(t) && ten !== "VN-Index (Bogle)" ? f(t, 2) : "-").padStart(7), `${w.hon}/${w.tong}`.padStart(8), f(w.xau, 2).padStart(8), f(k.soMa, 1).padStart(6), (Number.isFinite(k.tc) ? f(k.tc * 100, 0) : "-").padStart(5), f(k.quayVong, 2).padStart(9), "|", theoNam(k.rets).map((x) => f(x, 0).padStart(4)).join(" "));
  };
  dong("VN-Index (Bogle)", { rets: vr, soMa: NaN, tc: NaN, quayVong: NaN });
  const kq = {};
  for (const [k, pp] of dsPP) { kq[k] = pp === "FABER" ? faber(R) : chay(PP[k], R); dong(pp === "FABER" ? "Faber - VN-Index + trung binh 10 thang" : PP[k].ten, kq[k]); }
  // nua dau / nua sau
  const ch = Math.floor(vr.length / 2);
  console.log(`  -- Vuot VN-Index TB / thang (diem %): nua dau ${ngay[R[0]].slice(0, 7)} -> ${ngay[R[ch]].slice(0, 7)} | nua sau --`);
  for (const [k] of dsPP) { const ex = kq[k].rets.map((x, i) => (x - vr[i]) * 100); console.log("  ", (k === "FABER" ? "FABER" : k).padEnd(12), f(tb(ex.slice(0, ch)), 2).padStart(6), "|", f(tb(ex.slice(ch)), 2).padStart(6)); }
  return kq;
}

const R_A = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const R_B = cuoiThang.filter((i) => ngay[i] >= "2014-01-01" && i + 2 < N);
const kqA = bang("NHOM A (BCTC) 2022 -> nay, kiem tra moi quy", R_A, [["GRAHAM"], ["BUFFETT"], ["GREENBLATT"], ["LYNCH"], ["PIOTROSKI"], ["CO_TUC"], ["TICH_SAN"], ["HAUGEN"], ["LON_NHAT"], ["FABER", "FABER"]]);
bang("NHOM B (chi gia) 2014 -> nay, kiem tra moi quy", R_B, [["HAUGEN"], ["LON_NHAT"], ["FABER", "FABER"]]);

// ---------- danh sach hien tai ----------
let iGia = N - 1;
while (iGia > 0 && nen.FPT.at(-1).t < ngay[iGia]) iGia--;
console.log(`\n=================== DANH SACH HIEN TAI (gia ${ngay[iGia]}, BCTC quy ${quyHieuLuc(ngay[iGia])}) ===================`);
for (const k of ["GRAHAM", "BUFFETT", "GREENBLATT", "LYNCH", "PIOTROSKI", "CO_TUC", "TICH_SAN", "HAUGEN"]) {
  const P = PP[k].pool(iGia);
  console.log(`${PP[k].ten} (${P.length} ma dat): ${P.slice(0, 15).map((x) => ma[x.j]).join(" ")}`);
}
// do trung lap danh muc cuoi giai doan
const giaoNhau = (a, b) => a.filter((x) => b.includes(x)).length;
const ks = ["GRAHAM", "BUFFETT", "GREENBLATT", "LYNCH", "PIOTROSKI", "CO_TUC", "TICH_SAN"];
console.log("\nTrung lap danh muc dang cam (cuoi giai doan test), so ma chung:");
for (const a of ks) console.log(a.padEnd(11), ks.map((b) => String(giaoNhau(kqA[a].cuoi, kqA[b].cuoi)).padStart(4)).join(""), "  <-", ks.join(" "));

// ---------- DO NHAY THAM SO (doi nguong / so ma / bo ngan hang) cho cac phuong phap dung dau - de chac khong phai do chon tham so may man ----------
console.log("\n=================== DO NHAY THAM SO (nhom A, 2022 -> nay) ===================");
const vrA = R_A.slice(0, -1).map((i0, r) => vni[R_A[r + 1] + 1].c / vni[i0 + 1].c - 1);
const inNhay = (ten, k) => { const ex = k.rets.map((x, i) => x - vrA[i]); const ch = Math.floor(ex.length / 2); console.log(ten.padEnd(58), "CAGR", f(cagr(k.rets), 1).padStart(5), "| sut", f(sut(k.rets), 0).padStart(4), "| ma TB", f(k.soMa, 1).padStart(5), "| %TC", f(k.tc * 100, 0).padStart(3), "| vuot VNI nua dau / sau", f(tb(ex.slice(0, ch)) * 100, 2).padStart(5), "/", f(tb(ex.slice(ch)) * 100, 2).padStart(5)); };
const buffettPP = ({ roe = 15, pe = 20, no = 0.8, boTC = false, von = 5e12 } = {}) => ({
  pool: (i0) => xep(dsCoBan(i0).filter((x) => { const c = x.cb; if (boTC && c.tc) return false; if (x.von < von || !(c.ln > 0) || !(c.roe >= roe) || !(c.roe4 >= roe) || !(c.lnTang >= 0) || !(x.pe <= pe)) return false; return c.tc || (c.vay / c.vcsh <= no && c.cfo > 0); }), (x) => x.cb.roe, false),
  ban: PP.BUFFETT.ban,
});
const grahamPP = ({ pe = 15, pepb = 22.5, cr = 1.5, boTC = false, coTucBat = true } = {}) => ({
  pool: (i0) => dsCoBan(i0).filter((x) => { const c = x.cb; if (boTC && c.tc) return false; if (x.von < 5e12 || !(c.ln > 0) || !(x.pe <= pe) || !(x.pe * x.pb <= pepb)) return false; if (!c.tc && (!(c.tsnh / c.nnh >= cr) || c.vayDH > c.tsnh - c.nnh)) return false; if (c.quyCo < 4 || c.quyDuong < c.quyCo) return false; if (coTucBat && !(c.coTuc > 0)) return false; return c.lnTang >= 0; }).sort((a, b) => a.pe * a.pb - b.pe * b.pb),
  ban: (j, ctx) => !ctx.theo.has(j),
});
const coTucPP = ({ von = 5e12, boTC = false } = {}) => ({ pool: (i0) => coTuc(i0).filter((x) => x.von >= von && !(boTC && x.cb.tc)), ban: PP.CO_TUC.ban });
for (const [ten, pp, K] of [
  ["Buffett goc (ROE 15, PE 20, vay/VCSH 0,8, K 15)", buffettPP(), 15],
  ["Buffett ROE >= 12", buffettPP({ roe: 12 }), 15], ["Buffett ROE >= 18", buffettPP({ roe: 18 }), 15],
  ["Buffett PE <= 15", buffettPP({ pe: 15 }), 15], ["Buffett PE <= 25", buffettPP({ pe: 25 }), 15],
  ["Buffett von hoa >= 2.000 ty", buffettPP({ von: 2e12 }), 15],
  ["Buffett K = 10", buffettPP(), 10], ["Buffett K = 20", buffettPP(), 20],
  ["Buffett KHONG ngan hang / CK / BH", buffettPP({ boTC: true }), 15],
  ["Graham goc (PE 15, PExPB 22,5, TTHH 1,5)", grahamPP(), 15],
  ["Graham PE <= 12", grahamPP({ pe: 12 }), 15], ["Graham PExPB <= 30", grahamPP({ pepb: 30 }), 15],
  ["Graham TTHH >= 2 (dung nguyen ban)", grahamPP({ cr: 2 }), 15], ["Graham khong bat buoc co tuc", grahamPP({ coTucBat: false }), 15],
  ["Graham K = 10", grahamPP(), 10],
  ["Graham KHONG ngan hang / CK / BH", grahamPP({ boTC: true }), 15],
  ["Co tuc goc (von hoa >= 5.000 ty)", coTucPP(), 15], ["Co tuc von hoa >= 2.000 ty", coTucPP({ von: 2e12 }), 15], ["Co tuc K = 10", coTucPP(), 10],
  ["Co tuc KHONG ngan hang / CK / BH", coTucPP({ boTC: true }), 15],
]) inNhay(ten, chay(pp, R_A, K));

// ---------- TO HOP: chia von deu giua cac phuong phap it trung ma (tai can bang moi thang giua cac phan) ----------
console.log("\n=================== TO HOP PHUONG PHAP (nhom A) ===================");
const toHop = (ks) => ({ rets: vrA.map((_, i) => tb(ks.map((k) => kqA[k].rets[i]))), soMa: NaN, tc: tb(ks.map((k) => kqA[k].tc)) });
for (const ks of [["BUFFETT", "CO_TUC"], ["BUFFETT", "CO_TUC", "HAUGEN"], ["BUFFETT", "CO_TUC", "GRAHAM"], ["BUFFETT", "CO_TUC", "TICH_SAN"]]) {
  const k = toHop(ks); const ex = k.rets.map((x, i) => x - vrA[i]); const ch = Math.floor(ex.length / 2);
  const w = (() => { let hon = 0, tong = 0, xau = Infinity; for (let a = 0; a + 24 <= k.rets.length; a++) { const x = duong(k.rets.slice(a, a + 24)).at(-1), v = duong(vrA.slice(a, a + 24)).at(-1); tong++; if (x > v) hon++; xau = Math.min(xau, x); } return { hon, tong, xau }; })();
  console.log(ks.join(" + ").padEnd(36), "CAGR", f(cagr(k.rets), 1).padStart(5), "| sut", f(sut(k.rets), 0).padStart(4), "| 24T>VNI", `${w.hon}/${w.tong}`, "| 24T xau", f(w.xau, 2), "| %TC", f(k.tc * 100, 0), "| vuot VNI nua dau / sau", f(tb(ex.slice(0, ch)) * 100, 2), "/", f(tb(ex.slice(ch)) * 100, 2));
}

// ---------- THEM BO LOC XU HUONG GIA (Hieu: "FPT dang giam manh chua thay day, sao ma mua duoc") ----------
// Chi MUA MOI khi gia dang trong xu huong tot; tuy chon BAN them khi gia gay xu huong (xet o lan kiem tra quy). gg = duong can bang dai han (tinhCanBang).
const { tinhCanBang } = await import("../../lib/chiBaoKyThuat.js");
const GT = [], GB = [];
for (let j = 0; j < M; j++) {
  const bars = nen[ma[j]], cbk = tinhCanBang(bars), t = new Array(N).fill(null), b = new Array(N).fill(null);
  bars.forEach((x, p) => { const i = idx.get(x.t); if (i != null) { t[i] = cbk.top[p]; b[i] = cbk.bot[p]; } });
  GT.push(t); GB.push(b);
}
const sma200 = (j, i) => { let s = 0; for (let k = i - 199; k <= i; k++) s += C[j][k]; return s / 200; };
const XU = {
  "gia > SMA200": (j, i) => C[j][i] > sma200(j, i),
  "gia > SMA200 va SMA200 di len (so 20 phien)": (j, i) => C[j][i] > sma200(j, i) && sma200(j, i) > sma200(j, i - 20),
  "gia > can bang dai han (gg_top)": (j, i) => GT[j][i] > 0 && C[j][i] > GT[j][i],
  "gia cach dinh 252 phien <= 20%": (j, i) => { let m = 0; for (let k = i - 251; k <= i; k++) m = Math.max(m, C[j][k]); return C[j][i] >= 0.8 * m; },
};
const BAN_XU = {
  "": null,
  " + BAN khi gia < SMA200": (j, i) => C[j][i] < sma200(j, i),
  " + BAN khi gia < can bang duoi (gg_bot)": (j, i) => GB[j][i] > 0 && C[j][i] < GB[j][i],
};
console.log("\n=================== THEM BO LOC XU HUONG GIA (nhom A, 2022 -> nay) ===================");
for (const [tenGoc, goc] of [["Buffett", PP.BUFFETT], ["Co tuc", PP.CO_TUC], ["Graham", PP.GRAHAM]]) {
  inNhay(`${tenGoc} goc (khong xet xu huong)`, chay(goc, R_A));
  for (const [tx, fx] of Object.entries(XU)) for (const [tb2, fb] of Object.entries(BAN_XU)) {
    if (tb2 && tx !== "gia > SMA200" && tx !== "gia > can bang dai han (gg_top)") continue;
    const pp = { pool: (i0) => goc.pool(i0).filter((x) => fx(x.j, i0)), ban: (j, ctx) => goc.ban(j, ctx) || (fb ? fb(j, ctx.i0) : false) };
    // ma dang giu nhung gay xu huong (khong ban) van giu; ma dat co ban nhung chua dat xu huong thi CHO - pool rong -> tien mat
    inNhay(`  ${tenGoc}: chi mua khi ${tx}${tb2}`, chay(pp, R_A));
  }
}
let iG = N - 1; while (iG > 0 && nen.FPT.at(-1).t < ngay[iG]) iG--;
const jF = ma.indexOf("FPT"), jP = ma.indexOf("PNJ");
for (const j of [jF, jP]) console.log(`${ma[j]} ${ngay[iG]}: gia ${f(C[j][iG], 1)} | SMA200 ${f(sma200(j, iG), 1)} | gg_top ${f(GT[j][iG], 1)} gg_bot ${f(GB[j][iG], 1)}`);
// danh sach Buffett hom nay: ma da qua xu huong (gia > gg_top) va ma phai CHO
{
  const P = PP.BUFFETT.pool(iG);
  const ok = P.filter((x) => GT[x.j][iG] > 0 && C[x.j][iG] > GT[x.j][iG]), cho = P.filter((x) => !(GT[x.j][iG] > 0 && C[x.j][iG] > GT[x.j][iG]));
  const dinh = (j) => { let m = 0; for (let k = iG - 251; k <= iG; k++) m = Math.max(m, C[j][k]); return m; };
  const mo = (x) => `${ma[x.j]}(${f((C[x.j][iG] / dinh(x.j) - 1) * 100, 0)}%)`;
  console.log(`\nBuffett hom nay - DA qua xu huong (gia > can bang dai han), mua duoc: ${ok.map(mo).join(" ")}`);
  console.log(`Buffett hom nay - dat co ban nhung gia DUOI can bang dai han, CHO: ${cho.map(mo).join(" ")}`);
}

// ---------- BAT DAU TU DAU NAM 2026 (Hieu: "test thu ln neu bat dau tu nam 2026"): tin hieu 31/12/2025, mua 02/01/2026, den phien gia moi nhat ----------
{
  const R26 = [...cuoiThang.filter((i) => ngay[i] >= "2025-12-01" && i < iG - 1), iG - 1]; // diem cuoi = phien truoc phien gia moi nhat -> loi suat tinh den iG
  const vr26 = R26.slice(0, -1).map((i0, r) => vni[R26[r + 1] + 1].c / vni[i0 + 1].c - 1);
  const tong = (a) => (duong(a).at(-1) - 1) * 100;
  console.log(`\n=================== BAT DAU ${ngay[R26[0] + 1]} -> ${ngay[iG]} (${vr26.length} thang) ===================`);
  console.log("Phuong phap".padEnd(52), "lai".padStart(7), "sut".padStart(6), "| theo thang:", R26.slice(1).map((i) => ngay[i].slice(5, 7)).join("   "));
  const dong26 = (ten, rets) => console.log(ten.padEnd(52), (f(tong(rets), 1) + "%").padStart(7), (f(sut(rets), 0) + "%").padStart(6), "|", rets.map((x) => f(x * 100, 0).padStart(4)).join(" "));
  dong26("VN-Index", vr26);
  const buffettXu = { pool: (i0) => PP.BUFFETT.pool(i0).filter((x) => GT[x.j][i0] > 0 && C[x.j][i0] > GT[x.j][i0]), ban: PP.BUFFETT.ban };
  const kq26 = {};
  for (const [k, ten, pp] of [["BUFFETT", PP.BUFFETT.ten], ["BUFFETT_XU", "Buffett + chi mua khi gia > can bang dai han", buffettXu], ["CO_TUC"], ["GRAHAM"], ["LYNCH"], ["TICH_SAN"], ["HAUGEN"], ["LON_NHAT"], ["GREENBLATT"], ["PIOTROSKI"]]) {
    kq26[k] = chay(pp ?? PP[k], R26);
    dong26(ten ?? PP[k].ten, kq26[k].rets);
  }
  dong26("To hop Buffett + Co tuc", vr26.map((_, i) => (kq26.BUFFETT.rets[i] + kq26.CO_TUC.rets[i]) / 2));
  dong26("To hop Buffett (loc xu huong) + Co tuc", vr26.map((_, i) => (kq26.BUFFETT_XU.rets[i] + kq26.CO_TUC.rets[i]) / 2));
  // danh muc mua ban dau 02/01/2026 cua tung phuong phap va lai tung ma den nay
  const i0 = R26[0];
  for (const [ten, pp] of [["Buffett", PP.BUFFETT], ["Buffett + loc xu huong", buffettXu], ["Co tuc", PP.CO_TUC], ["Graham", PP.GRAHAM]]) {
    const ds = pp.pool(i0).slice(0, 15);
    console.log(`\n${ten} - mua 02/01/2026 (${ds.length} ma), lai tung ma den ${ngay[iG]} (neu giu nguyen):`);
    console.log("  " + ds.map((x) => `${ma[x.j]} ${f((C[x.j][iG] / C[x.j][i0 + 1] - 1) * 100, 0)}%`).join(" | "));
  }
}

// ---------- 2026 NHUNG LOAI TRU MA DINH PHAP LY (PNJ, DGC - Hieu bao 03/11). LUU Y: biet SAU su kien nen day la NHIN LAI, khong phai ket qua thuc te co the lap lai. ----------
{
  const LOAI = new Set(["PNJ", "DGC"].map((k) => ma.indexOf(k)).filter((j) => j >= 0));
  const R26 = [...cuoiThang.filter((i) => ngay[i] >= "2025-12-01" && i < iG - 1), iG - 1];
  const vr26 = R26.slice(0, -1).map((i0, r) => vni[R26[r + 1] + 1].c / vni[i0 + 1].c - 1);
  const tong = (a) => (duong(a).at(-1) - 1) * 100;
  console.log("\n=================== 2026, LOAI TRU PNJ + DGC (nhin lai) ===================");
  console.log("VN-Index".padEnd(46), (f(tong(vr26), 1) + "%").padStart(7));
  const buffettXu = { pool: (i0) => PP.BUFFETT.pool(i0).filter((x) => GT[x.j][i0] > 0 && C[x.j][i0] > GT[x.j][i0]), ban: PP.BUFFETT.ban };
  for (const [ten, pp] of [["Buffett", PP.BUFFETT], ["Buffett + loc xu huong", buffettXu], ["Co tuc", PP.CO_TUC], ["Graham", PP.GRAHAM], ["Lynch", PP.LYNCH], ["Tich san", PP.TICH_SAN]]) {
    const goc = chay(pp, R26);
    const loai = chay({ pool: (i0) => pp.pool(i0).filter((x) => !LOAI.has(x.j)), ban: (j, ctx) => LOAI.has(j) || pp.ban(j, ctx) }, R26);
    const bh = tb(loai.cuoi.map(() => 0)); // placeholder khong dung
    console.log(ten.padEnd(46), (f(tong(goc.rets), 1) + "%").padStart(7), "->", (f(tong(loai.rets), 1) + "%").padStart(7), "| ma sau khi loai:", loai.cuoi.map((j) => `${ma[j]} ${f((C[j][iG] / C[j][R26[0] + 1] - 1) * 100, 0)}%`).join(" "));
  }
  // PNJ / DGC lich su: ho da tung dong gop gi trong 2022-2025 vao cac phuong phap? (do ban nhin lai co bo sot khong)
  for (const k of ["PNJ", "DGC"]) { const j = ma.indexOf(k); const p = (a, b) => { const x = ngay.findIndex((t) => t >= a), y = ngay.findIndex((t) => t >= b); return (C[j][y] / C[j][x] - 1) * 100; }; console.log(`${k}: 2022-01 -> 2025-12 ${f(p("2022-01-03", "2025-12-31"), 0)}% | 2026 ${f(p("2026-01-05", ngay[iG]), 0)}% | dinh 1 nam -> nay ${f((C[j][iG] / Math.max(...C[j].slice(iG - 251, iG + 1)) - 1) * 100, 0)}%`); }
}
