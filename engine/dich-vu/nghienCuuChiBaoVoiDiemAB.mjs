// KET HOP 2 CHI BAO PINE (Banker Fund Flow, Reversal) VOI DIEM MUA A VA B (Hieu 04/11/2026: "ket hop vs diem mua A va B test").
// A = DIEM MUA THUONG cua he thong (tin hieu MUA loai 1, engine/dich-vu/backtestChung.mjs chayEngine); B = DIEM MUA PHUC HOI (giam 20-30% tu dinh 20 phien roi dong cua tren Tenkan + Kijun, engine/loi/diemMuaPhucHoi.js).
// Voi moi diem A / B tai phien tin hieu i, kiem tra TRANG THAI chi bao tai i (chi dung du lieu den het phien i), roi so lai CUA CAC LENH CO dieu kien voi KHONG CO:
//   Banker: green (trend > bull/bear: dong tien vao), tang (trend dang tang), vao5 (co tin hieu vao lenh V1 / zone / oversold-recovery trong 5 phien gan nhat), ob80 (trend > 80), out5 (co tin hieu THOAT mirrorExit / obRoll trong 5 phien),
//   Reversal: bullR5 (nen R chua xac nhan trong 5 phien), bullC5 (dau xac nhan trong 5 phien), bearR5 (nen dao chieu giam trong 5 phien).
// Do: loi suat mua MO CUA phien sau, sau 10 / 20 / 60 phien (phi 0,4%); rieng A con loi suat theo cach quan ly cua he thong (30% TP1 + 30% TP2, con lai theo BAN, cat lo, T+2, mua mo cua phien sau).
// Giai doan: truoc 2022.5 / tu 2022.5. Chi doc cache nen_dai.json. t-stat chua tinh trung lap giua cac ma cung ngay.
// Chay: node engine/dich-vu/nghienCuuChiBaoVoiDiemAB.mjs
import { docJson, chayEngine, moPhongThucTe, tb, md, f } from "./backtestChung.mjs";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const CP = 0.4;
const sma = (a, n) => { const o = new Array(a.length).fill(null); let s = 0, c = 0; for (let i = 0; i < a.length; i++) { if (a[i] != null) { s += a[i]; c++; } if (i >= n && a[i - n] != null) { s -= a[i - n]; c--; } if (i >= n - 1 && c === n) o[i] = s / n; } return o; };
const hhv = (a, n) => a.map((_, i) => (i >= n - 1 ? Math.max(...a.slice(i - n + 1, i + 1)) : null));
const llv = (a, n) => a.map((_, i) => (i >= n - 1 ? Math.min(...a.slice(i - n + 1, i + 1)) : null));
function ema(a, n) { const o = new Array(a.length).fill(null), k = 2 / (n + 1); let cnt = 0, s = 0, prev = null; for (let i = 0; i < a.length; i++) { if (a[i] == null) { prev = null; cnt = 0; s = 0; continue; } if (prev == null) { cnt++; s += a[i]; if (cnt === n) { prev = s / n; o[i] = prev; } continue; } prev = k * a[i] + (1 - k) * prev; o[i] = prev; } return o; }
function rma(a, n) { const o = new Array(a.length).fill(null); let prev = null, s = 0, cnt = 0; for (let i = 0; i < a.length; i++) { if (a[i] == null) continue; if (prev == null) { cnt++; s += a[i]; if (cnt === n) { prev = s / n; o[i] = prev; } continue; } prev = (prev * (n - 1) + a[i]) / n; o[i] = prev; } return o; }
function wsa(src, length, weight) {
  const n = src.length, sum = new Array(n).fill(null), out = new Array(n).fill(null);
  for (let t = 0; t < n; t++) {
    const prev = t > 0 && sum[t - 1] != null ? sum[t - 1] : 0;
    const sub = t - length >= 0 && src[t - length] != null ? src[t - length] : 0;
    sum[t] = src[t] == null ? null : prev - sub + src[t];
    const ma = t - length < 0 || src[t - length] == null || sum[t] == null ? null : sum[t] / length;
    const po = t > 0 ? out[t - 1] : null;
    out[t] = po == null ? ma : src[t] == null ? null : (src[t] * weight + po * (length - weight)) / length;
  }
  return out;
}
const cross = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] > b[i] && a[i - 1] <= b[i - 1];
const crossU = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] < b[i] && a[i - 1] >= b[i - 1];
const lvl = (a, v) => a.map(() => v);
const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };

const D = new Map();
const evB = [];
for (const [ma, b] of Object.entries(nen)) {
  if (b.length < 300) continue;
  const n = b.length, o = b.map((x) => x.o), h = b.map((x) => x.h), l = b.map((x) => x.l), c = b.map((x) => x.c), v = b.map((x) => x.v);
  const gt = new Array(n).fill(0); { let s = 0; for (let i = 0; i < n; i++) { s += (c[i] * v[i]) / 1e6; if (i >= 20) s -= (c[i - 20] * v[i - 20]) / 1e6; gt[i] = s / 20; } }
  // Banker Fund Flow
  const tp = c.map((x, i) => (2 * x + h[i] + l[i] + o[i]) / 5);
  const ll34 = llv(l, 34), hh34 = hhv(h, 34), ll27 = llv(l, 27), hh27 = hhv(h, 27);
  const raw = c.map((x, i) => (ll27[i] == null || hh27[i] === ll27[i] ? null : ((x - ll27[i]) / (hh27[i] - ll27[i])) * 100));
  const fast = wsa(raw, 5, 1), slow = wsa(fast, 3, 1);
  const trend = fast.map((x, i) => (x == null || slow[i] == null ? null : (3 * x - 2 * slow[i] - 50) * 1.032 + 50));
  const bb = ema(tp.map((x, i) => (ll34[i] == null || hh34[i] === ll34[i] ? null : ((x - ll34[i]) / (hh34[i] - ll34[i])) * 100)), 13);
  const vsma = sma(v, 20);
  const os = lvl(c, 20), ez = lvl(c, 25), ob = lvl(c, 80);
  const vaoEv = new Array(n).fill(false), outEv = new Array(n).fill(false);
  for (let i = 1; i < n; i++) {
    vaoEv[i] = (cross(trend, bb, i) && bb[i] < 25) || cross(bb, ez, i) || cross(trend, os, i);
    outEv[i] = (crossU(trend, bb, i) && bb[i] > 75) || crossU(trend, ob, i);
  }
  // Reversal
  const basis = sma(c, 19);
  const std = c.map((_, i) => { if (i < 18) return null; const w = c.slice(i - 18, i + 1), m = w.reduce((s, x) => s + x, 0) / 19; return Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / 19); });
  const upper = basis.map((x, i) => (x == null ? null : x + 2 * std[i])), lower = basis.map((x, i) => (x == null ? null : x - 2 * std[i]));
  const bullR = new Array(n).fill(false), bullC = new Array(n).fill(false), bearR = new Array(n).fill(false);
  for (let i = 2; i < n; i++) {
    if (lower[i] == null || lower[i - 1] == null || lower[i - 2] == null) continue;
    bullR[i] = l[i - 1] < lower[i - 1] && c[i - 1] < o[i - 1] && c[i] > lower[i] && c[i] > o[i];
    bullC[i] = l[i - 2] < lower[i - 2] && c[i - 2] < o[i - 2] && c[i - 1] > lower[i - 1] && c[i - 1] > o[i - 1] && c[i] > h[i - 1];
    bearR[i] = h[i - 1] > upper[i - 1] && c[i - 1] > o[i - 1] && c[i] < upper[i] && c[i] < o[i];
  }
  const goi = (a, i, k = 5) => { for (let j = Math.max(0, i - k + 1); j <= i; j++) if (a[j]) return true; return false; };
  const d = { ma, n, t: b.map((x) => x.t), o, h, l, c, gt, trend, bb, vaoEv, outEv, bullR, bullC, bearR, goi };
  D.set(ma, d);
  // Diem B (nhu engine/loi/diemMuaPhucHoi.js): giam >= 10% roi loc nhom 20-30%
  let ult = -99;
  for (let i = 130; i < n - 2; i++) {
    if (gt[i] < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 10) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (!(c[i] > tk && c[i] > kj && i - kDay >= 3 && i - ult >= 15)) continue;
    ult = i;
    if (giam >= 20 && giam < 30) evB.push({ d, i });
  }
}
const { lenh } = chayEngine({ cache: nen, vni });
const evA = lenh.filter((t) => t.loai === 1 && D.has(t.ma)).map((t) => ({ d: D.get(t.ma), i: t.iv, t })).filter((e) => e.d.gt[e.i] >= 3);
console.log(`Diem A (mua thuong): ${evA.length} lenh; diem B (giam 20-30%): ${evB.length} lenh; ${D.size} ma`);

const KY = (e) => (e.d.t[e.i] < "2022-05-01" ? 0 : 1);
const fwd = (e, H) => (e.i + 1 + H < e.d.n ? (e.d.c[e.i + 1 + H] / e.d.o[e.i + 1] - 1) * 100 - CP : null);
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const COND = {
  "Banker green (trend > bull/bear)": (d, i) => d.trend[i] != null && d.bb[i] != null && d.trend[i] > d.bb[i],
  "Banker trend dang tang": (d, i) => d.trend[i] != null && d.trend[i - 1] != null && d.trend[i] > d.trend[i - 1],
  "Banker green + tang": (d, i) => d.trend[i] != null && d.bb[i] != null && d.trend[i - 1] != null && d.trend[i] > d.bb[i] && d.trend[i] > d.trend[i - 1],
  "Banker co tin hieu VAO trong 5 phien": (d, i) => d.goi(d.vaoEv, i),
  "Banker trend > 80 (qua nong)": (d, i) => d.trend[i] != null && d.trend[i] > 80,
  "Banker trend < 20 (qua ban)": (d, i) => d.trend[i] != null && d.trend[i] < 20,
  "Banker co tin hieu THOAT trong 5 phien": (d, i) => d.goi(d.outEv, i),
  "Reversal nen R (chua xac nhan) trong 5 phien": (d, i) => d.goi(d.bullR, i),
  "Reversal dau xac nhan (V) trong 5 phien": (d, i) => d.goi(d.bullC, i),
  "Reversal nen giam (canh bao) trong 5 phien": (d, i) => d.goi(d.bearR, i),
};
function bang(tieuDe, ev, coQL) {
  console.log(`\n=================== ${tieuDe} ===================`);
  const hd = ["Dieu kien", "ky", "n co / khong", "10p co|khong", "20p co|khong", "t20", "60p co|khong"];
  if (coQL) hd.push("quan ly HT co|khong");
  console.log(hd[0].padEnd(46), hd[1].padEnd(9), hd[2].padStart(13), hd[3].padStart(17), hd[4].padStart(17), hd[5].padStart(6), hd[6].padStart(17), coQL ? hd[7].padStart(21) : "");
  // tat ca khong dieu kien
  const ql = (e) => { if (!coQL) return null; const t = e.t; const r = moPhongThucTe(t, { E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 }); return r; };
  for (const [kyTen, kyF] of [["tat ca", () => true], ["<2022.5", (e) => KY(e) === 0], [">=2022.5", (e) => KY(e) === 1]]) {
    const E = ev.filter(kyF);
    const base = [10, 20, 60].map((H) => tb(E.map((e) => fwd(e, H)).filter((x) => x != null)));
    console.log("(khong dieu kien - tat ca diem)".padEnd(46), kyTen.padEnd(9), String(E.length).padStart(13), f(base[0], 1).padStart(17), f(base[1], 1).padStart(17), "".padStart(6), f(base[2], 1).padStart(17), coQL ? f(tb(E.map(ql).filter((x) => x != null)), 2).padStart(21) : "");
  }
  for (const [ten, fn] of Object.entries(COND)) {
    for (const [kyTen, kyF] of [["tat ca", () => true], [">=2022.5", (e) => KY(e) === 1]]) {
      const E = ev.filter(kyF), co = E.filter((e) => fn(e.d, e.i)), kh = E.filter((e) => !fn(e.d, e.i));
      if (co.length < 30 || kh.length < 30) { console.log(ten.padEnd(46), kyTen.padEnd(9), `${co.length}/${kh.length}`.padStart(13), "(it)"); continue; }
      const m = (a, H) => { const r = a.map((e) => fwd(e, H)).filter((x) => x != null); return r; };
      const c10 = tb(m(co, 10)), k10 = tb(m(kh, 10)), c20 = tb(m(co, 20)), k20 = tb(m(kh, 20)), c60 = tb(m(co, 60)), k60 = tb(m(kh, 60));
      const r1 = m(co, 20), r2 = m(kh, 20), t20 = (tb(r1) - tb(r2)) / Math.sqrt(sd(r1) ** 2 / r1.length + sd(r2) ** 2 / r2.length);
      const q1 = coQL ? tb(co.map(ql).filter(Boolean).map((x) => x.ret ?? x)) : null, q2 = coQL ? tb(kh.map(ql).filter(Boolean).map((x) => x.ret ?? x)) : null;
      console.log(ten.padEnd(46), kyTen.padEnd(9), `${co.length}/${kh.length}`.padStart(13), `${f(c10, 1)} | ${f(k10, 1)}`.padStart(17), `${f(c20, 1)} | ${f(k20, 1)}`.padStart(17), f(t20, 1).padStart(6), `${f(c60, 1)} | ${f(k60, 1)}`.padStart(17), coQL ? `${f(q1, 2)} | ${f(q2, 2)}`.padStart(21) : "");
    }
  }
}
bang("DIEM A (mua thuong cua he thong) x CHI BAO (cac o: loi suat % khi CO dieu kien | KHONG co)", evA, true);
bang("DIEM B (mua phuc hoi, giam 20-30%) x CHI BAO", evB, false);

// ---------- ON DINH THEO NAM cua 2 ket hop ung vien: B + Banker green (20 phien) va A + nen dao chieu giam (quan ly he thong) ----------
console.log("\n=================== ON DINH THEO NAM ===================");
const nam = (e) => e.d.t[e.i].slice(0, 4);
const namList = [...new Set(evB.map(nam))].sort();
console.log("Nam".padEnd(6), "B green co | khong (20p, n)".padStart(36), "   A co nen giam | khong (quan ly HT, n)".padStart(46));
const gr = COND["Banker green (trend > bull/bear)"], bear = COND["Reversal nen giam (canh bao) trong 5 phien"];
for (const y of namList) {
  const bY = evB.filter((e) => nam(e) === y), aY = evA.filter((e) => nam(e) === y);
  const r20 = (a) => tb(a.map((e) => fwd(e, 20)).filter((x) => x != null));
  const ql = (a) => tb(a.map((e) => moPhongThucTe(e.t, { E: e.t.open[e.t.iv + 1], vao: e.t.iv + 1, banTu: e.t.iv + 3 })).filter((x) => x != null).map((x) => x.ret ?? x));
  const g1 = bY.filter((e) => gr(e.d, e.i)), g0 = bY.filter((e) => !gr(e.d, e.i)), a1 = aY.filter((e) => bear(e.d, e.i)), a0 = aY.filter((e) => !bear(e.d, e.i));
  console.log(y.padEnd(6), `${f(r20(g1), 1)} (${g1.length}) | ${f(r20(g0), 1)} (${g0.length})`.padStart(36), `${f(ql(a1), 2)} (${a1.length}) | ${f(ql(a0), 2)} (${a0.length})`.padStart(46));
}
