// TICH SAN vs DAU TU TANG TRUONG tren TT VN (Hieu 02/11/2026: "pp nao phu hop vs tt vn"). Du lieu: nen_dai.json (391 ma DANG niem yet, tu 2013) + vnindex_dai.json. Moi thang tai co cau, chia deu, phi 0,4%/vong * ty le doi ma.
// Chien luoc: (A) VN-Index; (B) TB deu tat ca ma thanh khoan (nen thi truong, co thien lech nguoi song sot -> so sanh voi B moi cong bang); (C) TICH SAN = 15 ma GTGD lon nhat (bluechip);
// (D) TICH SAN2 = 10 ma bien dong thap nhat 120 phien (trong ma thanh khoan); (E) TANG TRUONG = 10 ma dong luong 6-1 thang cao nhat; (F) 70% C + 30% E.
// Them: DCA moi thang (IRR) vao tung duong; theo giai doan <2019 / 2019-2022.4 / 2022.5+; sut giam toi da. Chay: node engine/dich-vu/nghienCuuTichSanTangTruong.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";

const vni = docJson("vnindex_dai.json");
const nen = docJson("nen_dai.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
const CHI_PHI = 0.004;
const GTGD_MIN = 5e6; // c(nghin dong) * v >= 5e6 = 5 ty
const ma = [], C = [], GT = [];
for (const [k, bars] of Object.entries(nen)) {
  if (bars.length < 260) continue;
  const c = new Array(N).fill(null), g = new Array(N).fill(0);
  for (const b of bars) { const i = idx.get(b.t); if (i != null) { c[i] = b.c; g[i] = b.c * b.v; } }
  let last = null; for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) c[i] = last; } // forward fill (chua co nen -> null)
  ma.push(k); C.push(c); GT.push(g);
}
const M = ma.length;
const soCp = ma.map((k) => SO_CP_LUU_HANH[k] ?? 0); // so CP hien tai (xap xi cho qua khu)
const vonHoa = (j, i) => C[j][i] * soCp[j];
// ngay cuoi thang
const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const batDau = cuoiThang.find((i) => i >= 260);
const R = cuoiThang.filter((i) => i >= batDau);
// du lieu ma tai i: co nen that o i (khong phai forward fill qua 5 ngay)
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += GT[j][k]; return s / 20; };
const co = (j, i) => C[j][i] != null && C[j][i - 130] != null && GT[j][i] > 0;
const vol = (j, i, n = 120) => { let s = 0, s2 = 0, m = 0; for (let k = i - n + 1; k <= i; k++) { const a = C[j][k], b = C[j][k - 1]; if (a == null || b == null) continue; const r = a / b - 1; s += r; s2 += r * r; m++; } if (m < n * 0.8) return NaN; const mu = s / m; return Math.sqrt(s2 / m - mu * mu); };
const chonTop = (i, diem, soMa, lon = true) => {
  const dsT = [];
  for (let j = 0; j < M; j++) { if (!co(j, i) || tb20(j, i) < GTGD_MIN) continue; const d = diem(j, i); if (Number.isFinite(d)) dsT.push([j, d]); }
  dsT.sort((a, b) => (lon ? b[1] - a[1] : a[1] - b[1]));
  return dsT.slice(0, soMa).map((x) => x[0]);
};
const tatCaThanhKhoan = (i) => { const r = []; for (let j = 0; j < M; j++) if (co(j, i) && tb20(j, i) >= GTGD_MIN) r.push(j); return r; };
const cs = {
  B: (i) => tatCaThanhKhoan(i),
  C: (i) => chonTop(i, (j, ii) => tb20(j, ii), 15, true),
  D: (i) => chonTop(i, (j, ii) => vol(j, ii), 10, false),
  H: (i) => chonTop(i, (j, ii) => vonHoa(j, ii), 15, true),
  E: (i) => chonTop(i, (j, ii) => C[j][ii - 21] / C[j][ii - 126] - 1, 10, true),
};
const TEN = { H: "TICH SAN3: 15 ma von hoa lon (deu)", G: "TICH SAN4: 30 ma von hoa lon (theo von hoa)", A: "VN-Index (giu)", B: "TB deu moi ma thanh khoan (nen)", C: "TICH SAN: 15 bluechip GTGD lon", D: "TICH SAN2: 10 ma it bien dong", E: "TANG TRUONG: 10 ma dong luong 6-1T", F: "70% H + 30% E" };
const ret = { A: [], B: [], C: [], D: [], E: [], H: [], G: [] };
const truoc = {};
for (let r = 0; r + 1 < R.length; r++) {
  const i0 = R[r], i1 = R[r + 1];
  ret.A.push(vni[i1].c / vni[i0].c - 1);
  for (const k of ["B", "C", "D", "E", "H", "G"]) {
    const ds = k === "G" ? chonTop(i0, (j, ii) => vonHoa(j, ii), 30, true) : cs[k](i0);
    if (!ds.length) { ret[k].push(0); continue; }
    const t = truoc[k] ? new Set(truoc[k]) : new Set();
    const giu = ds.filter((j) => t.has(j)).length;
    const doi = truoc[k] ? 1 - giu / ds.length : 1;
    let s = 0, tw = 0; for (const j of ds) { const w = k === "G" ? vonHoa(j, i0) : 1; s += w * (C[j][i1] / C[j][i0] - 1); tw += w; }
    ret[k].push(s / tw - CHI_PHI * doi);
    truoc[k] = ds;
  }
}
ret.F = ret.H.map((x, q) => 0.7 * x + 0.3 * ret.E[q]);
const nT = ret.A.length;
const thang = R.slice(1).map((i) => ngay[i].slice(0, 7));
const duong = (a) => { const o = [1]; for (const x of a) o.push(o.at(-1) * (1 + x)); return o; };
const cagr = (a) => (Math.pow(duong(a).at(-1), 12 / a.length) - 1) * 100;
const sut = (a) => { let pk = 1, v = 1, m = 0; for (const x of a) { v *= 1 + x; pk = Math.max(pk, v); m = Math.min(m, v / pk - 1); } return m * 100; };
const dh = (a) => { const m = tb(a), s = Math.sqrt(tb(a.map((x) => (x - m) ** 2))); return s * Math.sqrt(12) * 100; };
// DCA: gop 1 don vi moi thang vao cuoi thang, IRR nam
const dca = (a) => { const v = duong(a); let don = 0, tien = 0; for (let q = 0; q < v.length; q++) { don += 1 / v[q]; tien += 1; } const gt = don * v.at(-1); // tai cuoi: gia tri
  const tong = tien; let lo = -0.5, hi = 1; const npv = (r) => { let s = 0; const m = Math.pow(1 + r, 1 / 12); for (let q = 0; q < v.length; q++) s += Math.pow(m, v.length - 1 - q); return s - gt; }; // gia tri tuong lai cua dong tien dau tu o ty suat r so voi gia tri thuc
  for (let it = 0; it < 80; it++) { const mid = (lo + hi) / 2; if (npv(mid) < 0) lo = mid; else hi = mid; }
  return { irr: ((lo + hi) / 2) * 100, boi: gt / tong }; };
const doan = (tu, den) => thang.map((t, q) => (t >= tu && t < den ? q : -1)).filter((q) => q >= 0);
const GD = [["2013-07..2018", "2013-01", "2019-01"], ["2019..2022.4", "2019-01", "2022-05"], ["2022.5..2026", "2022-05", "2099"]];
console.log(`Tu ${thang[0]} den ${thang.at(-1)} (${nT} thang); ${M} ma, GTGD TB20 >= 5 ty. CHI Y: ma DANG niem yet -> thien lech nguoi song sot (nen B va moi chien luoc deu duoc nang len; so sanh voi B moi cong bang).`);
console.log("\n| chien luoc | CAGR% | sut toi da% | bien dong nam% | DCA IRR% | DCA gia tri/von |");
for (const k of ["A", "B", "C", "H", "G", "D", "E", "F"]) { const d = dca(ret[k]); console.log(`| ${TEN[k].padEnd(36)} | ${f(cagr(ret[k]), 1).padStart(5)} | ${f(sut(ret[k]), 1).padStart(6)} | ${f(dh(ret[k]), 1).padStart(5)} | ${f(d.irr, 1).padStart(5)} | ${f(d.boi, 2)} |`); }
console.log("\nTheo giai doan (CAGR% / sut toi da%):");
for (const [ten, tu, den] of GD) { const q = doan(tu, den); console.log(ten.padEnd(14), ["A", "B", "C", "H", "G", "D", "E", "F"].map((k) => { const a = q.map((x) => ret[k][x]); return `${k}:${f(cagr(a), 1)}/${f(sut(a), 0)}`; }).join("  ")); }
console.log("\nTheo nam (ca nam %):");
const nam = [...new Set(thang.map((t) => t.slice(0, 4)))];
for (const y of nam) { const q = thang.map((t, i) => (t.startsWith(y) ? i : -1)).filter((i) => i >= 0); console.log(y, ["A", "B", "C", "H", "G", "D", "E", "F"].map((k) => `${k}:${f((duong(q.map((x) => ret[k][x])).at(-1) - 1) * 100, 0).padStart(4)}`).join("  ")); }
// toan phan: lump-sum vs DCA cho VN-Index
const vA = duong(ret.A); console.log(`\nVN-Index: mua 1 lan dau ky -> x${f(vA.at(-1), 2)} (${f(cagr(ret.A), 1)}%/nam, khong tinh co tuc); DCA moi thang -> IRR ${f(dca(ret.A).irr, 1)}%/nam, gia tri/von x${f(dca(ret.A).boi, 2)}.`);
