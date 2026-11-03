// NANG CAP DANH GIA DANH MUC - KIEM CHUNG TREN DU LIEU VN (Hieu 04/11/2026: "tim hieu cach danh gia danh muc cua cac nha phan tich hang dau... nang cap phan danh gia ve do toi uu, hieu qua va cach thuc").
// Mo phong danh muc KIEU KHACH LE: moi 21 phien tu 2014, boc ngau nhien 60 danh muc 3-10 ma (mot nua dồn >= 1/2 so ma vao 1 nganh), ty trong ngau nhien (Dirichlet 1),
// chi lay ma co >= 250 phien lich su va GTGD TB20 >= 3 ty. Cac so do EX-ANTE (1 nam qua, ty trong hien tai) so voi KET QUA 63 / 126 phien tiep theo (giu nguyen so co phieu).
// A. Du bao bien dong: mau 1 nam (cach web dang dung) vs EWMA 0,94 / 0,97 (RiskMetrics) vs pha tron -> sai so, VaR 95% co dung 5% khong.
// B. So do nao bao truoc sut giam 6 thang: bien dong du bao, beta, so khoan doc lap (DR^2), ty trong ma lon nhat, tap trung nganh, rui ro don 1 ma, ty trong tren Kijun / tren can bang dai han, dong luong 6 thang.
// C. Diem suc khoe hien tai (tai tao 4 tru: da dang / rui ro / xu huong / - thanh khoan khong co tai san nen bo) co xep dung thu tu sut giam / loi nhuan khong.
// D. Cach chia ty trong tren CUNG cac ma: ngau nhien (nhu khach) vs chia deu vs nghich dao bien dong vs dong gop rui ro bang nhau (ERC) vs bien dong nho nhat (tran 40%) vs HRP.
// E. Bang tra cuu: bien dong du bao -> phan phoi sut giam toi da 6 thang (trung vi, 80%, 95%).
// Han che: chi co ma CON niem yet (thien lech song sot), 1 thi truong, ty trong ngau nhien khong phai danh muc that. Chay: node engine/dich-vu/nghienCuuDanhGiaDanhMucNangCao.mjs
import { docJson, taoNgauNhien, f } from "./backtestChung.mjs";
import { tinhIchimoku, tinhCanBang } from "../../lib/chiBaoKyThuat.js";

const nen = docJson("nen_dai.json");
const vniBars = docJson("vnindex_dai.json");
const nganhMap = docJson("nganh_map.json");
const ngay = vniBars.map((b) => b.t);
const N = ngay.length;
const iNgay = new Map(ngay.map((t, i) => [t, i]));
const vniC = vniBars.map((b) => b.c);

// canh theo lich VN-Index
const MA = [];
const C = {}, GT20 = {}, KIJ = {}, CBB = {}, DAU = {};
for (const [ma, bars] of Object.entries(nen)) {
  if (bars.length < 300) continue;
  const c = new Array(N).fill(null), kij = new Array(N).fill(null), cbb = new Array(N).fill(null), gt = new Array(N).fill(null);
  const ich = tinhIchimoku(bars), cb = tinhCanBang(bars);
  let s = 0;
  const q = [];
  for (let k = 0; k < bars.length; k++) {
    const i = iNgay.get(bars[k].t);
    const v = bars[k].c * bars[k].v * 1000;
    q.push(v); s += v; if (q.length > 20) s -= q.shift();
    if (i == null) continue;
    c[i] = bars[k].c; kij[i] = ich.kijun[k]; cbb[i] = cb.bot[k]; gt[i] = s / q.length;
  }
  let truoc = null;
  for (let i = 0; i < N; i++) { if (c[i] > 0) truoc = c[i]; else c[i] = truoc; } // ffill
  DAU[ma] = c.findIndex((x) => x > 0);
  MA.push(ma); C[ma] = c; KIJ[ma] = kij; CBB[ma] = cbb; GT20[ma] = gt;
}

const L = 250, H1 = 63, H2 = 126;
const ln = (a) => a.reduce((s, x) => s + x, 0);
const tb = (a) => ln(a) / a.length;
const sdv = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const ewma = (r, lam) => { let v = r.slice(0, 20).reduce((s, x) => s + x * x, 0) / 20; for (let t = 20; t < r.length; t++) v = lam * v + (1 - lam) * r[t] ** 2; return Math.sqrt(v); };
const quantile = (a, p) => { const s = [...a].sort((x, y) => x - y); const k = (s.length - 1) * p, lo = Math.floor(k); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (k - lo); };
const ddMax = (v) => { let pk = -Infinity, d = 0; for (const x of v) { if (x > pk) pk = x; d = Math.min(d, x / pk - 1); } return d; };

function cov(R) { // R: k mang loi suat cung do dai
  const k = R.length, T = R[0].length, mu = R.map(tb);
  const S = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < k; i++) for (let j = i; j < k; j++) { let s = 0; for (let t = 0; t < T; t++) s += (R[i][t] - mu[i]) * (R[j][t] - mu[j]); S[i][j] = S[j][i] = s / (T - 1); }
  return S;
}
// Ledoit-Wolf 2003: co ve ma tran tuong quan khong doi (constant correlation)
function covLW(R) {
  const k = R.length, T = R[0].length, mu = R.map(tb);
  const X = R.map((r, i) => r.map((x) => x - mu[i]));
  const S = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => { let s = 0; for (let t = 0; t < T; t++) s += X[i][t] * X[j][t]; return s / T; }));
  const sd = S.map((r, i) => Math.sqrt(r[i]));
  let rb = 0, cnt = 0;
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { rb += S[i][j] / (sd[i] * sd[j]); cnt++; }
  rb = cnt ? rb / cnt : 0;
  const F = S.map((r, i) => r.map((x, j) => (i === j ? x : rb * sd[i] * sd[j])));
  let pi = 0, rho = 0, gam = 0;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    let p = 0; for (let t = 0; t < T; t++) p += (X[i][t] * X[j][t] - S[i][j]) ** 2; p /= T; pi += p;
    gam += (F[i][j] - S[i][j]) ** 2;
    if (i === j) rho += p;
    else {
      let a = 0, b = 0;
      for (let t = 0; t < T; t++) { const xy = X[i][t] * X[j][t] - S[i][j]; a += (X[i][t] ** 2 - S[i][i]) * xy; b += (X[j][t] ** 2 - S[j][j]) * xy; }
      rho += (rb / 2) * (Math.sqrt(S[j][j] / S[i][i]) * (a / T) + Math.sqrt(S[i][i] / S[j][j]) * (b / T));
    }
  }
  const d = gam > 0 ? Math.max(0, Math.min(1, (pi - rho) / gam / T)) : 1;
  return S.map((r, i) => r.map((x, j) => d * F[i][j] + (1 - d) * x));
}
const Sw = (S, w) => S.map((r) => r.reduce((s, x, j) => s + x * w[j], 0));
const varW = (S, w) => { const a = Sw(S, w); return w.reduce((s, x, i) => s + x * a[i], 0); };
const chuan = (w) => { const s = ln(w); return w.map((x) => x / s); };
function wERC(S) { // dong gop rui ro bang nhau - lap kieu Spinu don gian
  const k = S.length; let w = chuan(S.map((r, i) => 1 / Math.sqrt(r[i])));
  for (let it = 0; it < 300; it++) { const a = Sw(S, w), v = varW(S, w); const rc = w.map((x, i) => (x * a[i]) / v); w = chuan(w.map((x, i) => x * (1 / k / rc[i]) ** 0.5)); }
  return w;
}
function wMinVar(S, tran = 0.4) { // bien dong nho nhat, khong ban khong, tran tung ma - gradient chieu
  const k = S.length; let w = new Array(k).fill(1 / k);
  const chieu = (v) => { // chieu len {0 <= w <= tran, tong 1}
    let lo = -1, hi = 1;
    for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; const s = v.reduce((a, x) => a + Math.min(tran, Math.max(0, x - m)), 0); if (s > 1) lo = m; else hi = m; }
    return v.map((x) => Math.min(tran, Math.max(0, x - (lo + hi) / 2)));
  };
  const buoc = 0.5 / Math.max(...S.map((r, i) => r[i]));
  for (let it = 0; it < 400; it++) { const g = Sw(S, w); w = chieu(w.map((x, i) => x - buoc * g[i])); }
  return chuan(w);
}
function wHRP(S) {
  const k = S.length; if (k < 3) return chuan(S.map((r, i) => 1 / r[i]));
  const sd = S.map((r, i) => Math.sqrt(r[i]));
  const D = S.map((r, i) => r.map((x, j) => Math.sqrt(Math.max(0, 0.5 * (1 - x / (sd[i] * sd[j]))))));
  // single linkage -> thu tu la (quasi-diag)
  let cum = Array.from({ length: k }, (_, i) => [i]);
  while (cum.length > 1) {
    let best = null;
    for (let a = 0; a < cum.length; a++) for (let b = a + 1; b < cum.length; b++) {
      let d = Infinity; for (const i of cum[a]) for (const j of cum[b]) d = Math.min(d, D[i][j]);
      if (!best || d < best.d) best = { a, b, d };
    }
    const moi = [...cum[best.a], ...cum[best.b]];
    cum = cum.filter((_, i) => i !== best.a && i !== best.b); cum.push(moi);
  }
  const thuTu = cum[0];
  const w = new Array(k).fill(1);
  const varNhom = (g) => { const iv = g.map((i) => 1 / S[i][i]); const ww = chuan(iv); return g.reduce((s, i, a) => s + g.reduce((t, j, b) => t + ww[a] * ww[b] * S[i][j], 0), 0); };
  const chia = (g) => { if (g.length < 2) return; const h = Math.floor(g.length / 2), A = g.slice(0, h), B = g.slice(h); const va = varNhom(A), vb = varNhom(B), al = 1 - va / (va + vb); for (const i of A) w[i] *= al; for (const i of B) w[i] *= 1 - al; chia(A); chia(B); };
  chia(thuTu);
  return chuan(w);
}

// ---------- mo phong ----------
const rnd = taoNgauNhien(20261104);
const dirichlet = (k) => chuan(Array.from({ length: k }, () => -Math.log(1 - rnd() * 0.999999)));
const MAU = [];
const CACH = ["ngau nhien", "chia deu", "nghich dao bien dong", "ERC", "bien dong nho nhat (tran 40%)", "bien dong nho nhat (tran 30%)", "bien dong nho nhat (tran 25%)", "HRP"];
const KQ_CACH = Object.fromEntries(CACH.map((c) => [c, []]));
for (let i0 = L + 30; i0 + H2 < N; i0 += 21) {
  if (ngay[i0] < "2014-01-01") continue;
  const du = MA.filter((m) => DAU[m] >= 0 && i0 - DAU[m] >= L + 5 && GT20[m][i0] >= 3e9 && C[m][i0] > 0);
  if (du.length < 30) continue;
  const theoNganh = new Map();
  for (const m of du) { const g = nganhMap[m] ?? "Khac"; if (!theoNganh.has(g)) theoNganh.set(g, []); theoNganh.get(g).push(m); }
  const nganhLon = [...theoNganh.entries()].filter(([, a]) => a.length >= 4).map(([g]) => g);
  for (let p = 0; p < 60; p++) {
    const k = 3 + Math.floor(rnd() * 8);
    const chon = new Set();
    if (p % 2 === 1 && nganhLon.length) {
      const ds = theoNganh.get(nganhLon[Math.floor(rnd() * nganhLon.length)]);
      const can = Math.min(ds.length, Math.ceil(k / 2) + Math.floor(rnd() * (k / 2)));
      while (chon.size < can) chon.add(ds[Math.floor(rnd() * ds.length)]);
    }
    while (chon.size < k) chon.add(du[Math.floor(rnd() * du.length)]);
    const ds = [...chon];
    const w = dirichlet(k);
    const R = ds.map((m) => { const a = []; for (let t = i0 - L + 1; t <= i0; t++) a.push(C[m][t] / C[m][t - 1] - 1); return a; });
    const rv = []; for (let t = i0 - L + 1; t <= i0; t++) rv.push(vniC[t] / vniC[t - 1] - 1);
    const S = cov(R);
    const rp = rv.map((_, t) => R.reduce((s, r, i) => s + w[i] * r[t], 0));
    const sdP = Math.sqrt(varW(S, w));
    const sd = S.map((r, i) => Math.sqrt(r[i]));
    const dr = w.reduce((s, x, i) => s + x * sd[i], 0) / sdP;
    const a = Sw(S, w); const rc = w.map((x, i) => (x * a[i]) / (sdP * sdP));
    const vV = sdv(rv), mV = tb(rv);
    const beta = ds.map((_, i) => { const mi = tb(R[i]); let s = 0; for (let t = 0; t < L; t++) s += (R[i][t] - mi) * (rv[t] - mV); return s / (L - 1) / (vV * vV); });
    const betaP = w.reduce((s, x, i) => s + x * beta[i], 0);
    const nganhW = new Map(); ds.forEach((m, i) => { const g = nganhMap[m] ?? "Khac"; nganhW.set(g, (nganhW.get(g) ?? 0) + w[i]); });
    const trenKij = ds.reduce((s, m, i) => s + (KIJ[m][i0] > 0 && C[m][i0] >= KIJ[m][i0] ? w[i] : 0), 0);
    const trenCB = ds.reduce((s, m, i) => s + (!(CBB[m][i0] > 0) || C[m][i0] >= CBB[m][i0] ? w[i] : 0), 0);
    const mom6 = ds.reduce((s, m, i) => s + w[i] * (C[m][i0] / C[m][i0 - 126] - 1), 0);
    let tqTB = 0, cnt = 0; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { tqTB += S[i][j] / (sd[i] * sd[j]); cnt++; }
    // ket qua tuong lai: giu nguyen so co phieu (ty trong troi theo gia)
    const tuongLai = (ww, H) => {
      const v = []; for (let t = i0; t <= i0 + H; t++) v.push(ds.reduce((s, m, i) => s + ww[i] * (C[m][t] / C[m][i0]), 0));
      const r = v.slice(1).map((x, t) => x / v[t] - 1);
      let xau20 = 0; for (let t = 20; t < v.length; t++) xau20 = Math.min(xau20, v[t] / v[t - 20] - 1);
      return { vol: sdv(r) * Math.sqrt(250), dd: ddMax(v), lai: v[v.length - 1] - 1, xau20, r };
    };
    const t63 = tuongLai(w, H1), t126 = tuongLai(w, H2);
    const vni126 = vniC[i0 + H2] / vniC[i0] - 1;
    let vniDD = 0; { let pk = -Infinity; for (let t = i0; t <= i0 + H2; t++) { pk = Math.max(pk, vniC[t]); vniDD = Math.min(vniDD, vniC[t] / pk - 1); } }
    MAU.push({
      ngay: ngay[i0], k, w, volS: sdP * Math.sqrt(250), volE94: ewma(rp, 0.94) * Math.sqrt(250), volE97: ewma(rp, 0.97) * Math.sqrt(250), volV: vV * Math.sqrt(250), volV97: ewma(rv, 0.97) * Math.sqrt(250),
      var95S: 1.645 * sdP, var95E: 1.645 * ewma(rp, 0.97), var95H: -quantile(rp, 0.05),
      betaP, enb: dr * dr, top1: Math.max(...w), hhiN: 1 / ln(w.map((x) => x * x)), maxRC: Math.max(...rc), nganhMax: Math.max(...nganhW.values()), tqTB: cnt ? tqTB / cnt : 0,
      trenKij, trenCB, mom6, t63, t126, vni126, vniDD,
    });
    // D. cach chia ty trong tren cung ma
    const SL = covLW(R);
    const wIV = chuan(sd.map((x) => 1 / x));
    const cachW = { "ngau nhien": w, "chia deu": new Array(k).fill(1 / k), "nghich dao bien dong": wIV, ERC: wERC(SL), "bien dong nho nhat (tran 40%)": wMinVar(SL, 0.4), "bien dong nho nhat (tran 30%)": wMinVar(SL, Math.max(0.3, 1 / k + 0.01)), "bien dong nho nhat (tran 25%)": wMinVar(SL, Math.max(0.25, 1 / k + 0.01)), HRP: wHRP(SL) };
    for (const c of CACH) { const x = tuongLai(cachW[c], H2); KQ_CACH[c].push({ ngay: ngay[i0], vol: x.vol, dd: x.dd, lai: x.lai, volTruoc: Math.sqrt(varW(S, cachW[c])) * Math.sqrt(250), top: Math.max(...cachW[c]) }); }
  }
}
console.log(`${MAU.length} danh muc, ${new Set(MAU.map((x) => x.ngay)).size} ngay danh gia (${MAU[0].ngay} -> ${MAU.at(-1).ngay})\n`);

// ---------- A. du bao bien dong ----------
console.log("A. DU BAO BIEN DONG 63 phien toi (nam hoa) - ty le thuc te / du bao: trung vi, sai so log RMSE, tuong quan hang");
const hang = (a) => { const s = a.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); s.forEach(([, i], k) => (r[i] = k)); return r; };
const tqHang = (a, b) => { const ra = hang(a), rb = hang(b), ma = tb(ra), mb = tb(rb); let s = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { s += (ra[i] - ma) * (rb[i] - mb); x += (ra[i] - ma) ** 2; y += (rb[i] - mb) ** 2; } return s / Math.sqrt(x * y); };
const thuc = MAU.map((m) => m.t63.vol);
const DUBAO = { "mau 1 nam (web hien tai)": (m) => m.volS, "EWMA 0,94": (m) => m.volE94, "EWMA 0,97": (m) => m.volE97, "tron 1/2 mau + 1/2 EWMA 0,97": (m) => (m.volS + m.volE97) / 2 };
for (const [ten, g] of Object.entries(DUBAO)) {
  const d = MAU.map(g);
  const tl = thuc.map((x, i) => x / d[i]);
  const rmse = Math.sqrt(tb(thuc.map((x, i) => Math.log(x / d[i]) ** 2)));
  console.log(`  ${ten.padEnd(34)} thuc/du bao trung vi ${f(quantile(tl, 0.5), 2)} (10%-90%: ${f(quantile(tl, 0.1), 2)}-${f(quantile(tl, 0.9), 2)})  RMSE log ${f(rmse, 3)}  tuong quan hang ${f(tqHang(d, thuc), 3)}`);
}
console.log("  VaR 95% 1 phien: ty le phien 63 ngay toi lo vuot VaR (dung = 5%)");
for (const [ten, k] of [["mau 1 nam, chuan", "var95S"], ["EWMA 0,97, chuan", "var95E"], ["lich su 1 nam (web hien tai)", "var95H"]]) {
  let vuot = 0, tong = 0; for (const m of MAU) for (const r of m.t63.r) { tong++; if (r < -m[k]) vuot++; }
  console.log(`  ${ten.padEnd(34)} ${f((vuot / tong) * 100, 2)}%`);
}

// ---------- B. so do nao bao truoc sut giam ----------
console.log("\nB. NGU PHAN VI cua tung so do -> sut giam toi da 126 phien toi (TB), bien dong 126 phien, lai 126 phien, lai - VN-Index");
const DO = { "bien dong du bao (tron)": (m) => (m.volS + m.volE97) / 2, beta: (m) => m.betaP, "so khoan doc lap DR^2": (m) => m.enb, "ty trong ma lon nhat": (m) => m.top1, "so ma hieu dung 1/sum w^2": (m) => m.hhiN, "rui ro don 1 ma (RC max)": (m) => m.maxRC, "nganh lon nhat": (m) => m.nganhMax, "tuong quan TB": (m) => m.tqTB, "ty trong tren Kijun": (m) => m.trenKij, "ty trong tren can bang dai han": (m) => m.trenCB, "dong luong 6 thang": (m) => m.mom6, "bien dong VN-Index (EWMA)": (m) => m.volV97 };
function nguPhanVi(g, kq = (m) => m.t126.dd) {
  const s = [...MAU].sort((a, b) => g(a) - g(b));
  const out = [];
  for (let q = 0; q < 5; q++) { const p = s.slice(Math.floor((q * s.length) / 5), Math.floor(((q + 1) * s.length) / 5)); out.push({ x: tb(p.map(g)), dd: tb(p.map((m) => m.t126.dd)) * 100, vol: tb(p.map((m) => m.t126.vol)) * 100, lai: tb(p.map((m) => m.t126.lai)) * 100, vuot: tb(p.map((m) => m.t126.lai - m.vni126)) * 100, kq: tb(p.map(kq)) }); }
  return out;
}
for (const [ten, g] of Object.entries(DO)) {
  const q = nguPhanVi(g);
  console.log(`  ${ten.padEnd(32)} ${q.map((x) => `[${f(x.x, 2)}] DD ${f(x.dd, 1)} vol ${f(x.vol, 0)} lai ${f(x.lai, 1)} vs VNI ${f(x.vuot, 1)}`).join(" | ")}`);
}
// tach anh huong bien dong: phan du DD sau khi hoi quy theo bien dong du bao
const X = MAU.map((m) => (m.volS + m.volE97) / 2), Y = MAU.map((m) => m.t126.dd);
const mx = tb(X), my = tb(Y); let sxy = 0, sxx = 0; for (let i = 0; i < X.length; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2; }
const bH = sxy / sxx, aH = my - bH * mx;
console.log(`\n  Hoi quy DD126 = ${f(aH, 3)} + ${f(bH, 3)} x bien dong du bao.  PHAN DU (DD thuc - du theo bien dong; am = te hon du kien) theo ngu phan vi tung so do:`);
for (const [ten, g] of Object.entries(DO)) {
  if (ten.startsWith("bien dong du bao")) continue;
  const q = nguPhanVi(g, (m) => m.t126.dd - (aH + bH * ((m.volS + m.volE97) / 2)));
  console.log(`  ${ten.padEnd(32)} ${q.map((x) => `[${f(x.x, 2)}] ${f(x.kq * 100, 2)}`).join(" | ")}`);
}

const kep = (x, a, b) => Math.max(a, Math.min(b, x));
const diemCu = (m) => {
  let dd = 25 * kep(m.enb - 1, 0, 1); if (m.maxRC > 0.4) dd -= 5; if (m.nganhMax > 0.6) dd -= 5;
  const tl = m.volS / m.volV; const rr = tl <= 1 ? 25 : tl >= 1.6 ? 10 : 25 - ((tl - 1) / 0.6) * 15;
  return kep(dd, 0, 25) + rr + 25 * m.trenKij;
};
// B2. TRONG CUNG NGAY (bo anh huong thoi diem thi truong): xep hang so do trong tung ngay, ket qua tru TB cua ngay do
console.log("\nB2. TRONG CUNG NGAY: ngu phan vi theo hang trong ngay -> DD126 / lai126 CHENH so voi TB cung ngay (diem %)");
const theoNgay = new Map(); for (const m of MAU) { if (!theoNgay.has(m.ngay)) theoNgay.set(m.ngay, []); theoNgay.get(m.ngay).push(m); }
const tbNgay = new Map([...theoNgay].map(([d, a]) => [d, { dd: tb(a.map((m) => m.t126.dd)), lai: tb(a.map((m) => m.t126.lai)) }]));
function trongNgay(g) {
  const pr = new Map();
  for (const a of theoNgay.values()) { const s = [...a].sort((x, y) => g(x) - g(y)); s.forEach((m, i) => pr.set(m, i / (s.length - 1))); }
  const out = [];
  for (let q = 0; q < 5; q++) { const p = MAU.filter((m) => { const r = pr.get(m); return r >= q / 5 && (q === 4 ? r <= 1 : r < (q + 1) / 5); }); out.push({ dd: tb(p.map((m) => m.t126.dd - tbNgay.get(m.ngay).dd)) * 100, lai: tb(p.map((m) => m.t126.lai - tbNgay.get(m.ngay).lai)) * 100 }); }
  return out;
}
const DO2 = { ...DO, "ty le vol / VN-Index": (m) => m.volS / m.volV, "diem suc khoe (tai tao)": null };
for (const [ten, g0] of Object.entries(DO2)) {
  if (ten.startsWith("bien dong VN-Index")) continue;
  const g = g0 ?? ((m) => diemCu(m));
  const q = trongNgay(g);
  console.log(`  ${ten.padEnd(32)} ${q.map((x, i) => `Q${i + 1} DD ${x.dd >= 0 ? "+" : ""}${f(x.dd, 1)} lai ${x.lai >= 0 ? "+" : ""}${f(x.lai, 1)}`).join(" | ")}`);
}

// ---------- C. diem suc khoe hien tai ----------
console.log("\nC. DIEM SUC KHOE (tai tao: da dang + rui ro + xu huong Kijun, thang 75) -> ket qua 126 phien");
const qC = nguPhanVi(diemCu);
qC.forEach((x, i) => console.log(`  nhom ${i + 1} diem TB ${f(x.x, 0)}: DD ${f(x.dd, 1)}%  vol ${f(x.vol, 0)}%  lai ${f(x.lai, 1)}%  hon VNI ${f(x.vuot, 1)}%`));
for (const [ten, g] of [["chi tru da dang", (m) => { let dd = 25 * kep(m.enb - 1, 0, 1); if (m.maxRC > 0.4) dd -= 5; if (m.nganhMax > 0.6) dd -= 5; return kep(dd, 0, 25); }], ["chi tru rui ro (vol/VNI)", (m) => -m.volS / m.volV], ["chi tru xu huong", (m) => m.trenKij]]) {
  const q = nguPhanVi(g);
  console.log(`  ${ten.padEnd(26)} ${q.map((x) => `DD ${f(x.dd, 1)} lai ${f(x.lai, 1)}`).join(" | ")}`);
}

// ---------- D. cach chia ty trong ----------
console.log("\nD. CACH CHIA TY TRONG tren CUNG cac ma (126 phien toi, giu nguyen so co phieu) - TB moi danh muc");
const ky = (t) => (t < "2018-01-01" ? "2014-17" : t < "2022-01-01" ? "2018-21" : "2022-26");
for (const c of CACH) {
  const a = KQ_CACH[c], goc = KQ_CACH["ngau nhien"];
  const thang = a.filter((x, i) => x.lai / x.vol > goc[i].lai / goc[i].vol).length / a.length;
  const ddTot = a.filter((x, i) => x.dd > goc[i].dd).length / a.length;
  const theoKy = ["2014-17", "2018-21", "2022-26"].map((kk) => { const b = a.filter((x) => ky(x.ngay) === kk); return `${kk}: lai ${f(tb(b.map((x) => x.lai)) * 100, 1)} DD ${f(tb(b.map((x) => x.dd)) * 100, 1)}`; }).join(", ");
  console.log(`  ${c.padEnd(30)} vol ${f(tb(a.map((x) => x.vol)) * 100, 1)}%  DD ${f(tb(a.map((x) => x.dd)) * 100, 1)}% (DD 10% te nhat ${f(quantile(a.map((x) => x.dd), 0.1) * 100, 1)}%)  lai ${f(tb(a.map((x) => x.lai)) * 100, 2)}%  lai/vol ${f(tb(a.map((x) => x.lai)) / tb(a.map((x) => x.vol)), 3)}  hon ngau nhien: lai/vol ${f(thang * 100, 0)}%, DD ${f(ddTot * 100, 0)}%  ma lon nhat TB ${f(tb(a.map((x) => x.top)) * 100, 0)}%`);
  console.log(`  ${"".padEnd(30)} ${theoKy}`);
}

// ---------- E. bang tra cuu bien dong -> sut giam ----------
console.log("\nE. BIEN DONG DU BAO (tron) -> SUT GIAM TOI DA 126 phien toi: trung vi / 80% / 95% truong hop khong te hon");
const mocV = [0, 0.22, 0.26, 0.30, 0.35, 0.42, 9];
for (let b = 0; b + 1 < mocV.length; b++) {
  const p = MAU.filter((m) => { const v = (m.volS + m.volE97) / 2; return v >= mocV[b] && v < mocV[b + 1]; });
  if (p.length < 50) continue;
  const dd = p.map((m) => -m.t126.dd * 100), l = p.map((m) => m.t126.lai * 100);
  console.log(`  vol ${f(mocV[b] * 100, 0)}-${f(Math.min(mocV[b + 1], 0.99) * 100, 0)}% (${p.length} mau): DD trung vi ${f(quantile(dd, 0.5), 1)}%  80%: ${f(quantile(dd, 0.8), 1)}%  95%: ${f(quantile(dd, 0.95), 1)}%  | lai 6 thang 10%-50%-90%: ${f(quantile(l, 0.1), 1)} / ${f(quantile(l, 0.5), 1)} / ${f(quantile(l, 0.9), 1)}%`);
}
// ti le DD / vol
const tl = MAU.map((m) => -m.t126.dd / ((m.volS + m.volE97) / 2));
console.log(`  He so DD6T / vol du bao: trung vi ${f(quantile(tl, 0.5), 2)}, 80% ${f(quantile(tl, 0.8), 2)}, 95% ${f(quantile(tl, 0.95), 2)}`);
// theo VNI vol regime
const tlV = MAU.map((m) => (m.volS + m.volE97) / 2 / m.volV97);
console.log(`  (tham khao) tuong quan hang vol danh muc / vol VNI hien tai voi DD: ${f(tqHang(tlV, MAU.map((m) => m.t126.dd)), 3)}`);

// ---------- F. CHAM LAI DIEM: trong so tru + cach cham lien tuc; chon tren 2014-2019, kiem tren 2020-2026 ----------
console.log("\nF. CACH CHAM DIEM (trong cung ngay): chenh DD126 va lai126 giua nhom diem cao nhat va thap nhat (Q5 - Q1, diem %), tuong quan hang voi DD");
const tuongQuanTrongNgay = (g, loc) => { // TB tuong quan hang theo tung ngay
  const a = []; for (const [d, ds] of theoNgay) { if (!loc(d)) continue; a.push(tqHang(ds.map(g), ds.map((m) => m.t126.dd))); } return tb(a);
};
const chenh = (g, loc) => {
  const p = MAU.filter((m) => loc(m.ngay)); const pr = new Map();
  const nhom = new Map(); for (const m of p) { if (!nhom.has(m.ngay)) nhom.set(m.ngay, []); nhom.get(m.ngay).push(m); }
  for (const a of nhom.values()) { const s = [...a].sort((x, y) => g(x) - g(y)); s.forEach((m, i) => pr.set(m, i / (s.length - 1))); }
  const q1 = p.filter((m) => pr.get(m) < 0.2), q5 = p.filter((m) => pr.get(m) >= 0.8);
  const d = (a, k) => tb(a.map((m) => m.t126[k] - tbNgay.get(m.ngay)[k]));
  return { dd: (d(q5, "dd") - d(q1, "dd")) * 100, lai: (d(q5, "lai") - d(q1, "lai")) * 100 };
};
const truDaDangCu = (m) => { let dd = 25 * kep(m.enb - 1, 0, 1); if (m.maxRC > 0.4) dd -= 5; if (m.nganhMax > 0.6) dd -= 5; return kep(dd, 0, 25) / 25; };
const truRuiRoCu = (m) => { const tl = m.volS / m.volV; return (tl <= 1 ? 25 : tl >= 1.6 ? 10 : 25 - ((tl - 1) / 0.6) * 15) / 25; };
const volF = (m) => (m.volS + m.volE97) / 2, volFV = (m) => (m.volV + m.volV97) / 2;
const truRuiRoMoi = (m) => kep(1 - (volF(m) / volFV(m) - 0.8) / 1.0, 0, 1); // ty le 0,8 -> 1 diem, 1,8 -> 0
const truDaDangMoi = (m) => kep(0.45 * kep((m.enb - 1) / 2, 0, 1) + 0.3 * kep(1 - (m.maxRC - 0.25) / 0.5, 0, 1) + 0.25 * kep(1 - (m.nganhMax - 0.4) / 0.5, 0, 1), 0, 1);
const truXuHuong = (m) => m.trenKij;
const ung = {
  "HIEN TAI 25/25/25 (da dang/rui ro/xu huong)": (m) => 25 * truDaDangCu(m) + 25 * truRuiRoCu(m) + 25 * truXuHuong(m),
  "cu, trong so 25/40/10": (m) => 25 * truDaDangCu(m) + 40 * truRuiRoCu(m) + 10 * truXuHuong(m),
  "moi lien tuc 25/25/25": (m) => 25 * truDaDangMoi(m) + 25 * truRuiRoMoi(m) + 25 * truXuHuong(m),
  "moi lien tuc 30/35/10": (m) => 30 * truDaDangMoi(m) + 35 * truRuiRoMoi(m) + 10 * truXuHuong(m),
  "moi lien tuc 30/40/5": (m) => 30 * truDaDangMoi(m) + 40 * truRuiRoMoi(m) + 5 * truXuHuong(m),
  "WEB xu huong HIEN TAI 20/25/30 (Kijun)": (m) => 20 * truDaDangCu(m) + 25 * truRuiRoCu(m) + 30 * truXuHuong(m),
  "WEB xu huong MOI 30/35/15 lien tuc": (m) => 30 * truDaDangMoi(m) + 35 * truRuiRoMoi(m) + 15 * truXuHuong(m),
  "WEB dai han HIEN TAI 25/20/10 (can bang)": (m) => 25 * truDaDangCu(m) + 20 * truRuiRoCu(m) + 10 * m.trenCB,
  "WEB dai han MOI 30/30/5 lien tuc": (m) => 30 * truDaDangMoi(m) + 30 * truRuiRoMoi(m) + 5 * m.trenCB,
  "chi rui ro moi": (m) => truRuiRoMoi(m),
  "chi da dang moi": (m) => truDaDangMoi(m),
};
const truoc = (d) => d < "2020-01-01", sau = (d) => d >= "2020-01-01";
for (const [ten, g] of Object.entries(ung)) {
  const a = chenh(g, truoc), b = chenh(g, sau);
  console.log(`  ${ten.padEnd(44)} 2014-19: DD ${f(a.dd, 1)} lai ${f(a.lai, 1)} tq ${f(-tuongQuanTrongNgay(g, truoc), 3)} | 2020-26: DD ${f(b.dd, 1)} lai ${f(b.lai, 1)} tq ${f(-tuongQuanTrongNgay(g, sau), 3)}`);
}
