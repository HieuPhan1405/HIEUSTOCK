// TEST 2 CHI BAO PINE (TradingView) TREN CO PHIEU VN (Hieu 04/11/2026): (1) [blackcat] L3 Banker Fund Flow Trend Oscillator V2 (dong tien vao / ra), (2) Reversal Indicator (nen dao chieu Bollinger).
// Dich theo cong thuc Pine (tham so mac dinh). Nen ngay nen_dai.json 2014 -> nay, GTGD TB20 >= 5 ty, khong co lenh BAN KHONG (co phieu VN khong ban khong) nen phia "short" duoc doc nhu tin hieu THOAT / CANH BAO.
// Event study: mua o gia MO CUA phien sau tin hieu, loi suat sau 5 / 10 / 20 / 60 phien, phi 0,4%; so voi MUA BAT KY PHIEN (moi 5 phien, cung ro, cung giai doan). Giai doan: truoc 2022.5 / tu 2022.5.
//   Banker: crossEntry (V1 "nen vang": trend cat len bull_bear va bull_bear < 25), zoneEntry (bull_bear cat len 25), osRecover (trend cat len 20); co / khong bo loc cua V2 (KL > SMA20 va trend dang tang). Thoat: mirrorExit (trend cat xuong bull_bear khi bull_bear > 75), obRoll (trend cat xuong 80).
//   Reversal: bullReversal / bullConfirm (dau V), + RSI confluence; bearReversal / bearConfirm doc nhu canh bao.
// Quan ly lenh (Banker, co phieu T+2): vao mo cua phien sau; thoat khi OUT (mirrorExit hoac obRoll) o gia mo cua phien sau (khong truoc T+2), hoac TP 3 ATR / SL 1,5 ATR tu gia dong cua tin hieu (khong truoc T+2: cham thi ban gia mo cua phien dau duoc ban), toi da 60 phien.
// Chay: node engine/dich-vu/nghienCuuChiBaoPine.mjs
import { docJson, tb, md, f } from "./backtestChung.mjs";

const nen = docJson("nen_dai.json");
const CP = 0.4;
const sma = (a, n) => { const o = new Array(a.length).fill(null); let s = 0, c = 0; for (let i = 0; i < a.length; i++) { if (a[i] != null) { s += a[i]; c++; } if (i >= n && a[i - n] != null) { s -= a[i - n]; c--; } if (i >= n - 1 && c === n) o[i] = s / n; } return o; };
const hhv = (a, n) => a.map((_, i) => (i >= n - 1 ? Math.max(...a.slice(i - n + 1, i + 1)) : null));
const llv = (a, n) => a.map((_, i) => (i >= n - 1 ? Math.min(...a.slice(i - n + 1, i + 1)) : null));
// ta.ema: gia tri dau = SMA cua `n` gia tri hop le dau tien, sau do de quy
function ema(a, n) {
  const o = new Array(a.length).fill(null), k = 2 / (n + 1);
  let cnt = 0, s = 0, prev = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] == null) { prev = null; cnt = 0; s = 0; continue; }
    if (prev == null) { cnt++; s += a[i]; if (cnt === n) { prev = s / n; o[i] = prev; } continue; }
    prev = k * a[i] + (1 - k) * prev; o[i] = prev;
  }
  return o;
}
// RMA (Wilder) cho ATR / RSI: gia tri dau = SMA
function rma(a, n) {
  const o = new Array(a.length).fill(null);
  let prev = null, s = 0, cnt = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] == null) continue;
    if (prev == null) { cnt++; s += a[i]; if (cnt === n) { prev = s / n; o[i] = prev; } continue; }
    prev = (prev * (n - 1) + a[i]) / n; o[i] = prev;
  }
  return o;
}
// calculate_weighted_simple_average cua blackcat (Pine) - giu dung logic
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

const D = [];
for (const [ma, b] of Object.entries(nen)) {
  if (b.length < 300) continue;
  const n = b.length, o = b.map((x) => x.o), h = b.map((x) => x.h), l = b.map((x) => x.l), c = b.map((x) => x.c), v = b.map((x) => x.v);
  const gt = new Array(n).fill(0); { let s = 0; for (let i = 0; i < n; i++) { s += (c[i] * v[i]) / 1e6; if (i >= 20) s -= (c[i - 20] * v[i - 20]) / 1e6; gt[i] = s / 20; } }
  // ---- Banker Fund Flow ----
  const tp = c.map((x, i) => (2 * x + h[i] + l[i] + o[i]) / 5);
  const ll34 = llv(l, 34), hh34 = hhv(h, 34), ll27 = llv(l, 27), hh27 = hhv(h, 27);
  const raw = c.map((x, i) => (ll27[i] == null || hh27[i] === ll27[i] ? null : ((x - ll27[i]) / (hh27[i] - ll27[i])) * 100));
  const fast = wsa(raw, 5, 1), slow = wsa(fast, 3, 1);
  const trend = fast.map((x, i) => (x == null || slow[i] == null ? null : (3 * x - 2 * slow[i] - 50) * 1.032 + 50));
  const bb = ema(tp.map((x, i) => (ll34[i] == null || hh34[i] === ll34[i] ? null : ((x - ll34[i]) / (hh34[i] - ll34[i])) * 100)), 13);
  const tr = c.map((x, i) => (i === 0 ? h[i] - l[i] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))));
  const atr = rma(tr, 14);
  const vsma = sma(v, 20);
  // ---- Bollinger / RSI cho Reversal ----
  const basis = sma(c, 19);
  const std = c.map((_, i) => { if (i < 18) return null; const w = c.slice(i - 18, i + 1), m = w.reduce((s, x) => s + x, 0) / 19; return Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / 19); });
  const upper = basis.map((x, i) => (x == null ? null : x + 2 * std[i]));
  const lower = basis.map((x, i) => (x == null ? null : x - 2 * std[i]));
  const up = c.map((x, i) => (i === 0 ? 0 : Math.max(x - c[i - 1], 0))), dn = c.map((x, i) => (i === 0 ? 0 : Math.max(c[i - 1] - x, 0)));
  const au = rma(up, 14), ad = rma(dn, 14);
  const rsi = au.map((x, i) => (x == null || ad[i] == null ? null : ad[i] === 0 ? 100 : 100 - 100 / (1 + x / ad[i])));
  D.push({ ma, n, t: b.map((x) => x.t), o, h, l, c, v, gt, tp, trend, bb, atr, vsma, upper, lower, rsi });
}
console.log(`${D.length} ma`);

// ---------- tin hieu theo ngay ----------
const S = {}; // ten -> [{d, i}]
const them = (ten, d, i) => (S[ten] ??= []).push({ d, i });
const ctl = [];
for (const d of D) {
  const { n, trend, bb, c, o, h, l, v, vsma, lower, upper, rsi } = d;
  const os = lvl(c, 20), ez = lvl(c, 25), xz = lvl(c, 75), ob = lvl(c, 80);
  let ultGov = -99;
  for (let i = 130; i < n - 1; i++) {
    if (d.gt[i] < 5) continue;
    if (i % 5 === 0) ctl.push({ d, i });
    // Banker
    const goiVol = v[i] > vsma[i] * 1.0, tang = trend[i] != null && trend[i - 1] != null && trend[i] > trend[i - 1];
    const gate = goiVol && tang;
    const crossE = cross(trend, bb, i) && bb[i] < 25, zoneE = cross(bb, ez, i), osR = cross(trend, os, i);
    if (crossE) { them("B1 V1 nen vang (cat len, bb<25)", d, i); if (gate) them("B1g nen vang + bo loc V2", d, i); }
    if (zoneE) { them("B2 bull/bear cat len 25", d, i); if (gate) them("B2g bull/bear cat len 25 + loc", d, i); }
    if (osR) { them("B3 trend cat len 20", d, i); if (gate) them("B3g trend cat len 20 + loc", d, i); }
    if ((crossE || zoneE || osR) && gate && i - ultGov > 3) { ultGov = i; them("BG vao lenh V2 (tat ca kenh + loc, cooldown 3)", d, i); }
    if (crossU(trend, bb, i) && bb[i] > 75) them("BX mirrorExit (cat xuong, bb>75)", d, i);
    if (crossU(trend, ob, i)) them("BO obRoll (trend cat xuong 80)", d, i);
    // Reversal
    if (lower[i] != null && lower[i - 1] != null && lower[i - 2] != null) {
      const bull = l[i - 1] < lower[i - 1] && c[i - 1] < o[i - 1] && c[i] > lower[i] && c[i] > o[i];
      const bullC = l[i - 2] < lower[i - 2] && c[i - 2] < o[i - 2] && c[i - 1] > lower[i - 1] && c[i - 1] > o[i - 1] && c[i] > h[i - 1];
      const bear = h[i - 1] > upper[i - 1] && c[i - 1] > o[i - 1] && c[i] < upper[i] && c[i] < o[i];
      const bearC = h[i - 2] > upper[i - 2] && c[i - 2] > o[i - 2] && c[i - 1] < upper[i - 1] && c[i - 1] < o[i - 1] && c[i] < l[i - 1];
      const rsiBull = rsi[i] != null && rsi[i - 1] != null && rsi[i] > 30 && rsi[i - 1] <= 30;
      const rsiBear = rsi[i] != null && rsi[i - 1] != null && rsi[i] < 70 && rsi[i - 1] >= 70;
      if (bull) them("R1 bull reversal (R)", d, i);
      if (bullC) them("R2 bull confirm (dau V)", d, i);
      if (bull && rsiBull) them("R3 bull reversal + RSI cat len 30", d, i);
      if (bear) them("R4 bear reversal (canh bao)", d, i);
      if (bearC) them("R5 bear confirm (canh bao)", d, i);
      if (bear && rsiBear) them("R6 bear reversal + RSI cat xuong 70", d, i);
    }
  }
}
const KY = (d, i) => (d.t[i] < "2022-05-01" ? 0 : 1);
const fwd = (e, H) => (e.i + 1 + H < e.d.n ? (e.d.c[e.i + 1 + H] / e.d.o[e.i + 1] - 1) * 100 - CP : null);
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
function bang(tieuDe, dsTen, loc = () => true) {
  console.log(`\n=================== ${tieuDe} ===================`);
  console.log("Tin hieu".padEnd(46), "ky".padEnd(7), "n".padStart(6), ...[5, 10, 20, 60].map((H) => `${H}p TB/ctl/t`.padStart(21)));
  for (const ten of dsTen) {
    const all = (S[ten] ?? []).filter((e) => loc(e.d));
    for (const [kyTen, kyF] of [["tat ca", () => true], ["<2022.5", (e) => KY(e.d, e.i) === 0], [">=2022.5", (e) => KY(e.d, e.i) === 1]]) {
      const ev = all.filter(kyF), ct = ctl.filter((e) => loc(e.d) && kyF(e));
      if (ev.length < 20) { console.log(ten.padEnd(46), kyTen.padEnd(7), String(ev.length).padStart(6), "(it)"); continue; }
      const cells = [5, 10, 20, 60].map((H) => {
        const r = ev.map((e) => fwd(e, H)).filter((x) => x != null), rc = ct.map((e) => fwd(e, H)).filter((x) => x != null);
        const dif = tb(r) - tb(rc), se = Math.sqrt(sd(r) ** 2 / r.length + sd(rc) ** 2 / rc.length);
        return `${f(tb(r), 1)}/${f(tb(rc), 1)}/${f(dif / se, 1)}`.padStart(21);
      });
      console.log(ten.padEnd(46), kyTen.padEnd(7), String(ev.length).padStart(6), ...cells);
    }
  }
}
const BANKER = ["B1 V1 nen vang (cat len, bb<25)", "B1g nen vang + bo loc V2", "B2 bull/bear cat len 25", "B2g bull/bear cat len 25 + loc", "B3 trend cat len 20", "B3g trend cat len 20 + loc", "BG vao lenh V2 (tat ca kenh + loc, cooldown 3)", "BX mirrorExit (cat xuong, bb>75)", "BO obRoll (trend cat xuong 80)"];
const REV = ["R1 bull reversal (R)", "R2 bull confirm (dau V)", "R3 bull reversal + RSI cat len 30", "R4 bear reversal (canh bao)", "R5 bear confirm (canh bao)", "R6 bear reversal + RSI cat xuong 70"];
console.log("(moi o: loi suat TB % sau tin hieu / loi suat TB % mua bat ky ngay / t-stat chenh lech - t chua tinh trung lap giua cac ma cung ngay)");
bang("BANKER FUND FLOW - toan ro (GTGD TB20 >= 5 ty)", BANKER);
bang("REVERSAL - toan ro", REV);
// ro von hoa lon (dung GTGD TB cuoi lam thay the cho quy mo): 60 ma GTGD lon nhat hien nay
const top60 = new Set([...D].sort((a, b) => b.gt[b.n - 1] - a.gt[a.n - 1]).slice(0, 60).map((d) => d.ma));
bang("BANKER - 60 ma GTGD lon nhat hien nay", ["B1 V1 nen vang (cat len, bb<25)", "BG vao lenh V2 (tat ca kenh + loc, cooldown 3)", "B3g trend cat len 20 + loc"], (d) => top60.has(d.ma));
bang("REVERSAL - 60 ma GTGD lon nhat hien nay", ["R1 bull reversal (R)", "R2 bull confirm (dau V)", "R3 bull reversal + RSI cat len 30"], (d) => top60.has(d.ma));

// ---------- quan ly lenh Banker (long only, T+2) ----------
function sim(e, cfg) {
  const { d, i } = e;
  const vao = i + 1, banTu = i + 3;
  const E = d.o[vao];
  if (!(E > 0) || vao + cfg.toiDa >= d.n) return null;
  const tp = d.c[i] + 3 * d.atr[i], sl = d.c[i] - 1.5 * d.atr[i];
  if (cfg.stops && !(sl < E)) return null;
  let cho = false;
  const ra = (g, j) => ({ ret: (g / E - 1) * 100 - CP, bars: j - vao });
  for (let j = vao + 1; j <= vao + cfg.toiDa; j++) {
    if (j < banTu) {
      if ((cfg.stops && d.l[j] <= sl) || (cfg.out && (d.outAt?.[j - 1]))) cho = true;
      continue;
    }
    if (j === banTu && cho) return ra(d.o[j], j);
    if (cfg.stops && d.l[j] <= sl) return ra(Math.min(d.o[j], sl), j);
    if (cfg.stops && d.h[j] >= tp) return ra(Math.max(d.o[j], tp), j);
    if (cfg.out && d.outAt?.[j - 1]) return ra(d.o[j], j); // tin hieu OUT cuoi phien j-1 -> ban mo cua phien j
  }
  return ra(d.c[vao + cfg.toiDa], vao + cfg.toiDa);
}
for (const d of D) { // co OUT (mirrorExit hoac obRoll) theo phien
  d.outAt = new Array(d.n).fill(false);
  const ob = lvl(d.c, 80), xz = lvl(d.c, 75);
  for (let i = 1; i < d.n; i++) d.outAt[i] = (crossU(d.trend, d.bb, i) && d.bb[i] > 75) || crossU(d.trend, ob, i);
}
console.log("\n\n=================== QUAN LY LENH Banker (vao lenh V2 + loc, mua mo cua phien sau, T+2, phi 0,4%) ===================");
console.log("Cach thoat".padEnd(52), "ky".padEnd(8), "n".padStart(5), "lai TB".padStart(7), "trung vi".padStart(9), "thang%".padStart(7), "phien TB".padStart(9), "xau nhat".padStart(9));
const ev = S["BG vao lenh V2 (tat ca kenh + loc, cooldown 3)"];
const cacThoat = [
  ["OUT (mirrorExit / obRoll) + TP 3ATR / SL 1,5ATR, toi da 60", { stops: true, out: true, toiDa: 60 }],
  ["Chi OUT, toi da 60 phien", { stops: false, out: true, toiDa: 60 }],
  ["Chi TP 3ATR / SL 1,5ATR, toi da 60", { stops: true, out: false, toiDa: 60 }],
  ["Giu co dinh 20 phien", { stops: false, out: false, toiDa: 20 }],
  ["Giu co dinh 60 phien", { stops: false, out: false, toiDa: 60 }],
];
for (const [ten, cfg] of cacThoat) {
  for (const [kyTen, kyF] of [["tat ca", () => true], [">=2022.5", (e) => KY(e.d, e.i) === 1]]) {
    const r = ev.filter(kyF).map((e) => sim(e, cfg)).filter(Boolean);
    console.log(ten.padEnd(52), kyTen.padEnd(8), String(r.length).padStart(5), f(tb(r.map((x) => x.ret)), 2).padStart(7), f(md(r.map((x) => x.ret)), 2).padStart(9), f((r.filter((x) => x.ret > 0).length / r.length) * 100, 0).padStart(7), f(tb(r.map((x) => x.bars)), 1).padStart(9), f(Math.min(...r.map((x) => x.ret)), 0).padStart(9));
  }
}
// doi chung: mua bat ky ngay, giu 20 phien / 60 phien
for (const H of [20, 60]) for (const [kyTen, kyF] of [["tat ca", () => true], [">=2022.5", (e) => KY(e.d, e.i) === 1]]) {
  const r = ctl.filter(kyF).map((e) => sim(e, { stops: false, out: false, toiDa: H })).filter(Boolean);
  console.log(`DOI CHUNG: mua bat ky ngay, giu ${H} phien`.padEnd(52), kyTen.padEnd(8), String(r.length).padStart(5), f(tb(r.map((x) => x.ret)), 2).padStart(7), f(md(r.map((x) => x.ret)), 2).padStart(9), f((r.filter((x) => x.ret > 0).length / r.length) * 100, 0).padStart(7), f(tb(r.map((x) => x.bars)), 1).padStart(9), f(Math.min(...r.map((x) => x.ret)), 0).padStart(9));
}
