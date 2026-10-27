// NGHIEN CUU MO HINH MARKOV AN (HMM) (Hieu 27/10/2026: "thu Hidden Markov Model"). Hai cach dung, DEU KHONG NHIN TRUOC (xac suat LOC - forward - tai ngay T, tham so fit bang du lieu den het ngay refit, tai fit moi 63/126 phien):
//  (A) CHE DO THI TRUONG: HMM Gauss 2 / 3 trang thai tren loi suat ngay VN-Index (3.410 phien tu 2013, cua so fit 750 phien). Trang thai xep theo ky vong loi suat (0 = gau/xau nhat). Loc diem vao he thong theo che do tai ngay tin hieu.
//  (B) TRANG THAI TUNG MA: HMM 2 / 3 trang thai tren loi suat ngay cua ma (cua so 750, toi thieu 300 phien): P(trang thai tang) tai ngay tin hieu co doan duoc MFE / lai khong ("xac suat ma con tang").
// Lenh Mua thuong cua engine (4.436), cach ra HT (30/30 + BAN), KIJ (thung Kijun ban het, cat lo S), TK3 (30/30 + Tenkan 1/2 + Kijun not; da sua loi ban > 100%), phi 0,4%; quy uoc THUC TE (mua mo cua phien sau, ban tu T+2) va LY TUONG.
// Chay: node engine/dich-vu/nghienCuuHMM.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

// ---------------- HMM Gauss 1 chieu ----------------
const LOG2PI = Math.log(2 * Math.PI);
const logN = (x, m, v) => -0.5 * (LOG2PI + Math.log(v) + ((x - m) ** 2) / v);
function emisProb(x, m, v) { return Math.exp(logN(x, m, v)); }
function forwardPass(x, p) { // alpha da chuan hoa, tra { alpha[t][k], loglik }
  const n = x.length, K = p.mu.length, alpha = [], c = new Array(n);
  let ll = 0;
  for (let t = 0; t < n; t++) {
    const a = new Array(K);
    let s = 0;
    for (let k = 0; k < K; k++) {
      let pr = t === 0 ? p.pi[k] : 0;
      if (t > 0) for (let j = 0; j < K; j++) pr += alpha[t - 1][j] * p.A[j][k];
      a[k] = pr * emisProb(x[t], p.mu[k], p.v[k]);
      s += a[k];
    }
    if (!(s > 1e-300)) { s = 1e-300; for (let k = 0; k < K; k++) a[k] = 1 / K * 1e-300; }
    for (let k = 0; k < K; k++) a[k] /= s;
    c[t] = s; ll += Math.log(s);
    alpha.push(a);
  }
  return { alpha, c, ll };
}
function baumWelch(x, p0, iters = 40) {
  const n = x.length, K = p0.mu.length;
  let p = { pi: [...p0.pi], A: p0.A.map((r) => [...r]), mu: [...p0.mu], v: [...p0.v] };
  const vmin = 0.02 * variance(x);
  let llPrev = -Infinity;
  for (let it = 0; it < iters; it++) {
    const { alpha, c, ll } = forwardPass(x, p);
    const beta = new Array(n);
    beta[n - 1] = new Array(K).fill(1);
    for (let t = n - 2; t >= 0; t--) {
      beta[t] = new Array(K);
      for (let j = 0; j < K; j++) {
        let s = 0;
        for (let k = 0; k < K; k++) s += p.A[j][k] * emisProb(x[t + 1], p.mu[k], p.v[k]) * beta[t + 1][k];
        beta[t][j] = s / c[t + 1];
      }
    }
    const gam = alpha.map((a, t) => { const g = a.map((v, k) => v * beta[t][k]); const s = g.reduce((u, w) => u + w, 0) || 1; return g.map((v) => v / s); });
    const xi = Array.from({ length: K }, () => new Array(K).fill(0));
    for (let t = 0; t < n - 1; t++) {
      let s = 0;
      const tmp = Array.from({ length: K }, () => new Array(K));
      for (let j = 0; j < K; j++) for (let k = 0; k < K; k++) { tmp[j][k] = alpha[t][j] * p.A[j][k] * emisProb(x[t + 1], p.mu[k], p.v[k]) * beta[t + 1][k]; s += tmp[j][k]; }
      if (s > 0) for (let j = 0; j < K; j++) for (let k = 0; k < K; k++) xi[j][k] += tmp[j][k] / s;
    }
    const np = { pi: gam[0].map((v) => Math.max(v, 1e-6)), A: [], mu: [], v: [] };
    for (let j = 0; j < K; j++) {
      const row = xi[j].map((v) => v + 1e-3), s = row.reduce((u, w) => u + w, 0);
      np.A.push(row.map((v) => v / s));
      let g = 0, mx = 0;
      for (let t = 0; t < n; t++) { g += gam[t][j]; mx += gam[t][j] * x[t]; }
      const m = mx / (g || 1);
      let vv = 0;
      for (let t = 0; t < n; t++) vv += gam[t][j] * (x[t] - m) ** 2;
      np.mu.push(m); np.v.push(Math.max(vv / (g || 1), vmin));
    }
    const sp = np.pi.reduce((u, w) => u + w, 0);
    np.pi = np.pi.map((v) => v / sp);
    p = np;
    if (Math.abs(ll - llPrev) < 1e-4 * n / 1000) break;
    llPrev = ll;
  }
  return p;
}
function variance(a) { const m = tb(a); return tb(a.map((v) => (v - m) ** 2)); }
function khoiTao(x, K, kieu) {
  let keys;
  if (kieu === "ret") keys = x.map((v, i) => [v, i]);
  else { const med = [...x].sort((a, b) => a - b)[Math.floor(x.length / 2)]; keys = x.map((v, i) => [Math.abs(v - med), i]); }
  keys.sort((a, b) => a[0] - b[0]);
  const mu = [], v = [];
  for (let k = 0; k < K; k++) {
    const g = keys.slice(Math.floor((k * x.length) / K), Math.floor(((k + 1) * x.length) / K)).map((u) => x[u[1]]);
    mu.push(tb(g)); v.push(Math.max(variance(g), 0.02 * variance(x)));
  }
  const A = Array.from({ length: K }, (_, j) => Array.from({ length: K }, (_, k) => (j === k ? 0.9 : 0.1 / (K - 1))));
  return { pi: new Array(K).fill(1 / K), A, mu, v };
}
function fitHMM(x, K) {
  let tot = null, ll = -Infinity;
  for (const kieu of ["ret", "vol"]) {
    const p = baumWelch(x, khoiTao(x, K, kieu));
    const l = forwardPass(x, p).ll;
    if (l > ll) { ll = l; tot = p; }
  }
  // sap xep trang thai theo mu tang dan (0 = xau nhat)
  const ord = tot.mu.map((m, i) => [m, i]).sort((a, b) => a[0] - b[0]).map((u) => u[1]);
  return { pi: ord.map((i) => tot.pi[i]), A: ord.map((j) => ord.map((k) => tot.A[j][k])), mu: ord.map((i) => tot.mu[i]), v: ord.map((i) => tot.v[i]) };
}
// xac suat LOC tai moi phien (chi dung du lieu den het phien do): P[t] = [p0..pK-1] hoac null. Tra them du bao 1 phien ke tiep.
function locWalkForward(x, K, { minTrain, refitEvery, win }) {
  const n = x.length, P = new Array(n).fill(null), Pn = new Array(n).fill(null), par = new Array(n).fill(null);
  let p = null, last = -1e9, a = null;
  for (let t = 0; t < n; t++) {
    if (t >= minTrain && (p == null || t - last >= refitEvery)) {
      const s = Math.max(0, t - win + 1);
      p = fitHMM(x.slice(s, t + 1), K);
      const fw = forwardPass(x.slice(s, t + 1), p);
      a = fw.alpha[fw.alpha.length - 1];
      last = t;
    } else if (p) {
      const nxt = new Array(K).fill(0);
      let s = 0;
      for (let k = 0; k < K; k++) { for (let j = 0; j < K; j++) nxt[k] += a[j] * p.A[j][k]; nxt[k] *= emisProb(x[t], p.mu[k], p.v[k]); s += nxt[k]; }
      a = nxt.map((v) => (s > 1e-300 ? v / s : 1 / K));
    }
    if (p) {
      P[t] = a;
      Pn[t] = p.A[0].map((_, k) => a.reduce((u, aj, j) => u + aj * p.A[j][k], 0)); // du bao P(trang thai) phien t+1
      par[t] = p;
    }
  }
  return { P, Pn, par };
}

// ---------------- Du lieu ----------------
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const rets = (c) => c.map((v, i) => (i === 0 ? 0 : Math.log(v / c[i - 1]) * 100));

// (A) VN-Index
const VNI = {};
for (const K of [2, 3]) {
  const x = rets(vni.map((b) => b.c));
  VNI[K] = locWalkForward(x, K, { minTrain: 750, refitEvery: 63, win: 750 });
  const ngayIdx = new Map(vni.map((b, i) => [b.t, i]));
  VNI[K].ngayIdx = ngayIdx;
  const pCuoi = VNI[K].par[x.length - 1];
  console.log(`\nVN-Index HMM K=${K}: tham so lan fit cuoi (ngay ${vni[x.length - 1].t}): ` + pCuoi.mu.map((m, k) => `S${k}: mu ${f(m, 3)}%/ngay, vol ${f(Math.sqrt(pCuoi.v[k]), 2)}%, duy tri ${f(100 * pCuoi.A[k][k], 0)}%`).join(" | "));
  const d = vni.map((b, i) => [b.t, i]).filter(([t, i]) => t >= "2018-09-01" && VNI[K].P[i]);
  const dem = new Array(K).fill(0);
  d.forEach(([, i]) => dem[VNI[K].P[i].indexOf(Math.max(...VNI[K].P[i]))]++);
  console.log(`  ty le phien theo trang thai (2018.9+): ` + dem.map((v, k) => `S${k} ${f(100 * v / d.length, 0)}%`).join(" | "));
  // loi suat 5 phien tiep theo theo trang thai (de kiem chung ham y nghia, khong nhin truoc)
  const fw5 = new Array(K).fill(0).map(() => []);
  d.forEach(([, i]) => { if (i + 5 < vni.length) fw5[VNI[K].P[i].indexOf(Math.max(...VNI[K].P[i]))].push((vni[i + 5].c / vni[i].c - 1) * 100); });
  console.log(`  loi suat VN-Index 5 phien SAU theo trang thai hien tai: ` + fw5.map((a, k) => `S${k}: ${f(tb(a))}% (n ${a.length})`).join(" | "));
}

// (B) Tung ma
const STK = {};
for (const K of [2, 3]) {
  STK[K] = new Map();
  for (const ma of new Set(lenh.map((t) => t.ma))) {
    const bars = cache[ma];
    if (!bars || bars.length < 400) continue;
    const w = locWalkForward(rets(bars.map((b) => b.c)), K, { minTrain: 300, refitEvery: 126, win: 750 });
    STK[K].set(ma, { ...w, idx: new Map(bars.map((b, i) => [b.t, i])) });
  }
}
console.log("\nDa fit HMM tung ma:", STK[2].size, "ma");

for (const t of lenh) {
  for (const K of [2, 3]) {
    const i = VNI[K].ngayIdx.get(t.ngay);
    t["v" + K] = i != null ? VNI[K].P[i] : null;
    const s = STK[K].get(t.ma);
    const j = s?.idx.get(t.ngay);
    t["s" + K] = j != null ? s.P[j] : null;
    t["sn" + K] = j != null ? s.Pn[j] : null;
    t["sp" + K] = j != null ? s.par[j] : null;
  }
  let mx = t.E;
  for (let j = t.iv + 1; j < Math.min(t.n, t.iv + 21); j++) { if (t.low[j] <= t.S) break; mx = Math.max(mx, t.high[j]); }
  t.mfe = (mx / t.E - 1) * 100;
}

const CACH = [
  ["HT  (30/30 + BAN)", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["KIJ (thung Kijun ban het)", { moc: [], baoVe: false, theoSell: false, tk: "kijun" }],
  ["TK3 (30/30 + Tenkan 1/2 + Kijun not)", { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nua" }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const arg = (p) => p.indexOf(Math.max(...p));
const LOC = [
  ["Khong loc", () => true],
  ["VNI-HMM2: dang o trang thai TANG (S1)", (t) => t.v2 && arg(t.v2) === 1],
  ["VNI-HMM2: P(S1) > 0,7", (t) => t.v2 && t.v2[1] > 0.7],
  ["VNI-HMM3: KHONG o trang thai xau (S0)", (t) => t.v3 && arg(t.v3) !== 0],
  ["VNI-HMM3: o trang thai tang (S2)", (t) => t.v3 && arg(t.v3) === 2],
  ["VNI-HMM3: P(S0 xau) < 0,2", (t) => t.v3 && t.v3[0] < 0.2],
  ["VNI-HMM3: P(S2) > 0,5", (t) => t.v3 && t.v3[2] > 0.5],
  ["NGUOC VNI-HMM2: o trang thai xau (S0)", (t) => t.v2 && arg(t.v2) === 0],
  ["NGUOC VNI-HMM3: o trang thai xau (S0)", (t) => t.v3 && arg(t.v3) === 0],
  ["MA-HMM2: P(tang) > 0,5", (t) => t.s2 && t.s2[1] > 0.5],
  ["MA-HMM3: o trang thai tang (S2)", (t) => t.s3 && arg(t.s3) === 2],
  ["MA-HMM3: KHONG o trang thai xau (S0)", (t) => t.s3 && arg(t.s3) !== 0],
  ["NGUOC MA-HMM2: o trang thai xau", (t) => t.s2 && t.s2[1] <= 0.5],
];
const tuongQuan = (a, b) => { const n = a.length, ma = tb(a), mb = tb(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); };
const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const m = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = m; i = j + 1; } return r; };
const spear = (a, b) => (a.length > 30 ? tuongQuan(rank(a), rank(b)) : NaN);
const SO_LAN = 20;
for (const [tenQU, cvao] of QUY_UOC) {
  for (const [tenCach, cfg] of CACH) {
    const kq = lenh.map((t) => mp(t, { ...cfg, ...cvao(t) }));
    console.log(`\n=========== ${tenQU} | ${tenCach} ===========`);
    console.log("Bo loc".padEnd(42), "giu".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| loai: n".padStart(10), "lai TB".padStart(7), "| giai doan (<2019, 19-22.4, 22.5+) | 2026 (n, lai) | DM K=10 / K=20");
    for (const [ten, fn] of LOC) {
      const gi = [], lo = [];
      lenh.forEach((t, i) => { if (!kq[i]) return; (fn(t) ? gi : lo).push(i); });
      const kg = thongKe(gi.map((i) => kq[i])), kl = thongKe(lo.map((i) => kq[i]));
      const ky = [[], [], []];
      gi.forEach((i) => ky[kyOf(lenh[i].ngay)].push(kq[i].ret));
      const r26 = gi.filter((i) => lenh[i].ngay >= "2026-01-01").map((i) => kq[i].ret);
      const ds = gi.map((i) => lenh[i]), kqs = gi.map((i) => kq[i]);
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
      console.log(ten.padEnd(42), String(kg.n).padStart(5), f(kg.tb).padStart(7), f(kg.thang, 0).padStart(7), f(kg.pf).padStart(5), "|", String(kl.n).padStart(6), f(kl.tb).padStart(7), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
    if (tenCach.startsWith("HT") && tenQU === "THUC TE") {
      // phan (B): xac suat tang cua ma vs MFE va lai lenh
      console.log("\n  --- (B) P(trang thai TANG) cua ma tai ngay tin hieu vs MFE 20 phien / lai lenh (Spearman; theo giai doan <2019, 19-22.4, 22.5+) ---");
      for (const [ten, g] of [["MA-HMM2 P(tang) hien tai", (t) => t.s2?.[1]], ["MA-HMM2 P(tang) phien ke (du bao)", (t) => t.sn2?.[1]], ["MA-HMM3 P(S2) hien tai", (t) => t.s3?.[2]], ["MA-HMM3 P(S2) phien ke (du bao)", (t) => t.sn3?.[2]], ["MA-HMM3 P(S0 xau) hien tai", (t) => t.s3?.[0]], ["VNI-HMM3 P(S2) hien tai", (t) => t.v3?.[2]], ["VNI-HMM2 P(tang) hien tai", (t) => t.v2?.[1]]]) {
        const ok = lenh.map((t, i) => i).filter((i) => kq[i] && Number.isFinite(g(lenh[i])));
        const xs = ok.map((i) => g(lenh[i]));
        const rm = spear(xs, ok.map((i) => lenh[i].mfe)), rr = spear(xs, ok.map((i) => kq[i].ret));
        const kyR = [0, 1, 2].map((p) => { const o = ok.filter((i) => kyOf(lenh[i].ngay) === p); return o.length > 30 ? f(spear(o.map((i) => g(lenh[i])), o.map((i) => kq[i].ret)), 3) : "-"; });
        console.log(`   ${ten.padEnd(36)} n ${String(ok.length).padStart(5)} | rho MFE ${f(rm, 3).padStart(6)} | rho lai ${f(rr, 3).padStart(6)} | theo ky: ${kyR.join(" ")}`);
      }
    }
  }
}
