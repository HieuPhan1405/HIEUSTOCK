// HMM Gauss 1 chieu (Baum-Welch tu cai, khong thu vien) + xac suat LOC walk-forward khong nhin truoc - dung chung cho nghienCuuHMMChotLoi.mjs. Xem nghienCuuHMM.mjs cho cach dung.
import { tb } from "./backtestChung.mjs";

// ---------------- HMM Gauss 1 chieu ----------------
const LOG2PI = Math.log(2 * Math.PI);
const logN = (x, m, v) => -0.5 * (LOG2PI + Math.log(v) + ((x - m) ** 2) / v);
function emisProb(x, m, v) { return Math.exp(logN(x, m, v)); }
export function forwardPass(x, p) { // alpha da chuan hoa, tra { alpha[t][k], loglik }
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
export function variance(a) { const m = tb(a); return tb(a.map((v) => (v - m) ** 2)); }
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
export function fitHMM(x, K) {
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
export function locWalkForward(x, K, { minTrain, refitEvery, win }) {
  const n = x.length, P = new Array(n).fill(null), Pn = new Array(n).fill(null), par = new Array(n).fill(null), Er = new Array(n).fill(null);
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
      Er[t] = Pn[t].reduce((u, w, k) => u + w * p.mu[k], 0); // ky vong loi suat % phien ke tiep
    }
  }
  return { P, Pn, par, Er };
}

