// TICH SAN: CHON VAI MA ROI CAM DAI HAN, KHONG TAI CO CAU / KHONG DINH KY (Hieu 03/11/2026: "toi chi can cam dai han 1 so ma phu hop thoi, ko can dinh ky").
// Moi MOC BAT DAU s (cuoi thang tu 2022-01): rổ tich san tai s = cac ma dat bo loc (von hoa >= 20.000 ty, ROE >= 12%, LN tang >= 5%, CFO > 0, no <= 2,5 lan, thanh toan hien hanh >= 1; NH/CK/BH chi xet LN, ROE, tang truong),
// mua dong cua phien sau, chia deu va GIU NGUYEN den het H thang (khong ban, khong mua them). So sanh:
//   ALL  = ca ro (toi da 15 ma lon nhat);  TOP5 / TOP8 = 5 / 8 ma von hoa lon nhat;  NGAU NHIEN 5 = 5 ma bat ky (300 lan boc, xem phan bo);  DA NGANH 5 = ma lon nhat cua 5 nganh khac nhau;
//   BEN 5 = 5 ma co mat trong ro nhieu thang nhat 6 thang truoc s (chi dung du lieu truoc s);  VN-Index.
// Do: gia tri cuoi / von (TB), phan vi 10% va xau nhat, % lan hon VN-Index, % lan lo von, sut toi da trung binh (theo thang). Gia dieu chinh, phi bo qua (mua 1 lan).
// Chi gom ma DANG niem yet (thien lech nguoi song sot); von hoa theo so CP hien tai; cac moc bat dau CHONG LAN nen so lan thu doc lap it hon so in ra, dac biet H = 36, 48.
// Chay: node engine/dich-vu/nghienCuuNamGiuDaiHan.mjs
import { docJson, tb, f, taoNgauNhien } from "./backtestChung.mjs";
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
  const ln = ttm(b, q, 23003);
  const vcsh = (gtv(b, q, 14000) ?? NaN) + (gtv(b, q, 15000) ?? 0);
  const no = Number.isFinite(gtv(b, q, 13000)) ? gtv(b, q, 13000) : NaN;
  const lq = gtv(b, q, 23003), q4 = lui(q, 4), lq0 = q4 ? gtv(b, q4, 23003) : NaN;
  const o = { ln, vcsh, roe: (ln / vcsh) * 100, donBay: no / vcsh, quyKhongGiam: Number.isFinite(lq) && Number.isFinite(lq0) ? lq >= lq0 : null, cfo: ttm(b, q, 32000), tsnh: gtv(b, q, 11000), nnh: gtv(b, q, 13100) };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const viTri = new Map(cuoiThang.map((i, p) => [i, p]));
const R = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const memo = new Map();
function ro(i0) {
  if (memo.has(i0)) return memo.get(i0);
  const q = quyHieuLuc(ngay[i0]);
  const kq = [];
  if (q && i0 > 260) {
    for (let j = 0; j < M; j++) {
      if (!thanhKhoan(j, i0)) continue;
      const b = bctc[ma[j]], cb = coBan(j, q), von = vonHoa(j, i0);
      if (!(cb.ln > 0) || von < 2e13 || cb.roe < 12) continue;
      const ln0 = lui(q, 4) ? ttm(b, lui(q, 4), 23003) : NaN;
      const tang = Number.isFinite(ln0) && ln0 > 0 ? cb.ln / ln0 - 1 : cb.quyKhongGiam ? 0.05 : -1;
      if (tang < 0.05) continue;
      if (b.loai === "pi" && (!(cb.cfo > 0) || cb.donBay > 2.5 || !(cb.tsnh / cb.nnh >= 1))) continue;
      kq.push({ j, von });
    }
    kq.sort((a, b) => b.von - a.von);
  }
  const r = kq.slice(0, 15);
  memo.set(i0, r);
  return r;
}

// gia tri (von = 1, chia deu, giu nguyen) cua tap ma ds vao s, den het H thang: { x, sut }
function giuNguyen(ds, i0, H) {
  const dau = i0 + 1;
  const e = Math.min(N - 1, cuoiThang[viTri.get(i0) + H] + 1);
  let sut = 0, dinh = 1;
  for (let p = viTri.get(i0) + 1; p <= viTri.get(i0) + H; p++) {
    const t = Math.min(N - 1, cuoiThang[p] + 1);
    const v = tb(ds.map((j) => C[j][t] / C[j][dau]));
    dinh = Math.max(dinh, v);
    sut = Math.min(sut, v / dinh - 1);
  }
  return { x: tb(ds.map((j) => C[j][e] / C[j][dau])), sut };
}
const vniX = (i0, H) => vni[Math.min(N - 1, cuoiThang[viTri.get(i0) + H] + 1)].c / vni[i0 + 1].c;
const phanVi = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

for (const H of [12, 24, 36, 48]) {
  const batDau = R.filter((i0) => viTri.get(i0) + H < cuoiThang.length && cuoiH(i0, H) != null && ro(i0).length >= 8);
  function cuoiH(i0, h) { const p = viTri.get(i0) + h; return p < cuoiThang.length ? cuoiThang[p] : null; }
  if (batDau.length < 3) { console.log(`\nH = ${H}: khong du moc`); continue; }
  const rng = taoNgauNhien(H);
  const KQ = {};
  const them = (ten, r, v) => { (KQ[ten] ??= []).push({ x: r.x, sut: r.sut, v }); };
  const nganhRo = (ds) => { const seen = new Set(), out = []; for (const x of ds) { const g = nganh[ma[x.j]] ?? "?"; if (seen.has(g)) continue; seen.add(g); out.push(x); if (out.length === 5) break; } return out; };
  const rngRand = [];
  for (const i0 of batDau) {
    const r = ro(i0), v = vniX(i0, H);
    them("ALL ca ro (toi da 15 ma)", giuNguyen(r.map((x) => x.j), i0, H), v);
    them("TOP8 8 ma von hoa lon nhat", giuNguyen(r.slice(0, 8).map((x) => x.j), i0, H), v);
    them("TOP5 5 ma von hoa lon nhat", giuNguyen(r.slice(0, 5).map((x) => x.j), i0, H), v);
    them("DA NGANH 5 ma, moi nganh 1 ma", giuNguyen(nganhRo(r).map((x) => x.j), i0, H), v);
    // ben: co mat trong ro nhieu thang nhat trong 6 thang truoc s (chi dung du lieu truoc s)
    const p0 = viTri.get(i0);
    if (p0 >= 6) {
      const dem = new Map();
      for (let p = p0 - 6; p < p0; p++) for (const x of ro(cuoiThang[p])) dem.set(x.j, (dem.get(x.j) ?? 0) + 1);
      const ben = r.map((x) => ({ ...x, d: dem.get(x.j) ?? 0 })).sort((a, b) => b.d - a.d || b.von - a.von).slice(0, 5);
      them("BEN 5 ma o ro nhieu nhat 6 thang truoc", giuNguyen(ben.map((x) => x.j), i0, H), v);
    }
    for (let l = 0; l < 300; l++) {
      const a = [...r];
      for (let k = a.length - 1; k > 0; k--) { const m = Math.floor(rng() * (k + 1)); [a[k], a[m]] = [a[m], a[k]]; }
      rngRand.push({ ...giuNguyen(a.slice(0, 5).map((x) => x.j), i0, H), v });
    }
    them("VN-Index", { x: v, sut: 0 }, v);
  }
  console.log(`\n=========== Cam ${H} thang | ${batDau.length} moc bat dau (${ngay[batDau[0]]} -> ${ngay[batDau.at(-1)]}) ===========`);
  console.log("Cach chon".padEnd(44), "TB x".padStart(6), "p10".padStart(6), "xau nhat".padStart(9), "hon VNI".padStart(9), "lo von".padStart(8), "sut TB".padStart(7));
  const in1 = (ten, a) => console.log(ten.padEnd(44), f(tb(a.map((o) => o.x)), 3).padStart(6), f(phanVi(a.map((o) => o.x), 0.1), 2).padStart(6), f(Math.min(...a.map((o) => o.x)), 2).padStart(9), `${a.filter((o) => o.x > o.v).length}/${a.length}`.padStart(9), `${a.filter((o) => o.x < 1).length}/${a.length}`.padStart(8), (ten === "VN-Index" ? "-" : f(tb(a.map((o) => o.sut)) * 100, 0) + "%").padStart(7));
  for (const [ten, a] of Object.entries(KQ)) in1(ten, a);
  in1("NGAU NHIEN 5 ma trong ro (300 lan / moc)", rngRand);
}

// ---- tung ma: do ben vung cua viec la "ma tich san" va ket qua rieng le ----
console.log("\n=========== Tung ma trong ro tich san: so thang co mat / tong so thang co du lieu (2022-01 -> nay) ===========");
const dem = new Map(); let tongThang = 0;
for (const i0 of R) { const r = ro(i0); if (r.length < 8) continue; tongThang++; for (const x of r) dem.set(x.j, (dem.get(x.j) ?? 0) + 1); }
let iGia = N - 1; while (iGia > 0 && nen.FPT.at(-1).t < ngay[iGia]) iGia--;
const nay = ro(iGia);
console.log(`(${tongThang} thang co ro >= 8 ma)`);
const hang = [...dem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log("Hay o trong ro nhat:", hang.map(([j, d]) => `${ma[j]} ${d}/${tongThang}`).join(" | "));
console.log("Ro hom nay:", nay.map((x) => `${ma[x.j]}[${nganh[ma[x.j]] ?? "?"}] ${dem.get(x.j) ?? 0}/${tongThang}`).join(" | "));
// ket qua rieng le 24T cua ma trong ro: bao nhieu ma lo / hon VN-Index
for (const H of [24, 36]) {
  let n = 0, lo = 0, hon = 0; const xs = [];
  for (const i0 of R) { if (viTri.get(i0) + H >= cuoiThang.length) continue; const r = ro(i0); if (r.length < 8) continue; const v = vniX(i0, H); for (const x of r) { const e = Math.min(N - 1, cuoiThang[viTri.get(i0) + H] + 1); const m = C[x.j][e] / C[x.j][i0 + 1]; n++; xs.push(m); if (m < 1) lo++; if (m > v) hon++; } }
  console.log(`Ma don le cam ${H}T: ${n} lan-ma; lo von ${f((lo / n) * 100, 0)}%; hon VN-Index ${f((hon / n) * 100, 0)}%; TB x${f(tb(xs), 2)}; p10 x${f(phanVi(xs, 0.1), 2)}; xau nhat x${f(Math.min(...xs), 2)}; tot nhat x${f(Math.max(...xs), 2)}`);
}
