// CHOT LOI CHO DIEM B (diem mua phuc hoi) - Hieu 04/11/2026: "test chot loi cho diem B luon". Diem B va cac moc cat lo SL / TP1 / TP2 / TP3 lay DUNG tu engine (engine/loi/diemMuaPhucHoi.js, giam 20-30% tu dinh 20 phien, dong cua tren Tenkan + Kijun, SL = gia - 2,5 ATR kep 3-10%, TP1/TP2/TP3 = dinh 60 / may+can bang / dinh 252 nen, cach vao >= 5 / 10 / 15%).
// Quy uoc THUC TE: mua o gia MO CUA phien sau, ban duoc tu chieu T+2 (cham SL / co tin hieu thoat truoc do thi ban gia mo cua phien dau duoc ban), phi 0,4%. Tin hieu Pine (khong dung nen R): OUT = Banker mirrorExit / obRoll, XC = nen dao chieu giam xac nhan; ban gia MO CUA phien sau. Lenh chua thoat het sau toiDa phien dong theo gia dong cua.
// Cach chot loi: khong TP (giu co dinh), chot het o TP1, thang TP1/TP2/TP3 (1/3 moi muc), 50% TP1, 30% TP1 + 30% TP2 roi thoat theo Kijun / MA50, va cac cach co tin hieu Pine / ATR.
// Chay: node engine/dich-vu/nghienCuuChotLoiDiemB.mjs
import { docJson, chayEngine, tb, md, f } from "./backtestChung.mjs";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { NGANH } from "../danh-sach/nganh.js";
import { tinhDiemMuaPhucHoi } from "../loi/diemMuaPhucHoi.js";

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
const crossU = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] < b[i] && a[i - 1] >= b[i - 1];
const cross = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] > b[i] && a[i - 1] <= b[i - 1];
const lvl = (a, v) => a.map(() => v);

const D = new Map();
for (const [ma, b] of Object.entries(nen)) {
  if (b.length < 300) continue;
  const n = b.length, o = b.map((x) => x.o), h = b.map((x) => x.h), l = b.map((x) => x.l), c = b.map((x) => x.c), v = b.map((x) => x.v);
  const gt = new Array(n).fill(0); { let s = 0; for (let i = 0; i < n; i++) { s += (c[i] * v[i]) / 1e6; if (i >= 20) s -= (c[i - 20] * v[i - 20]) / 1e6; gt[i] = s / 20; } }
  const tp = c.map((x, i) => (2 * x + h[i] + l[i] + o[i]) / 5);
  const ll34 = llv(l, 34), hh34 = hhv(h, 34), ll27 = llv(l, 27), hh27 = hhv(h, 27);
  const raw = c.map((x, i) => (ll27[i] == null || hh27[i] === ll27[i] ? null : ((x - ll27[i]) / (hh27[i] - ll27[i])) * 100));
  const fast = wsa(raw, 5, 1), slow = wsa(fast, 3, 1);
  const trend = fast.map((x, i) => (x == null || slow[i] == null ? null : (3 * x - 2 * slow[i] - 50) * 1.032 + 50));
  const bb = ema(tp.map((x, i) => (ll34[i] == null || hh34[i] === ll34[i] ? null : ((x - ll34[i]) / (hh34[i] - ll34[i])) * 100)), 13);
  const ob = lvl(c, 80);
  const outEv = new Array(n).fill(false), obEv = new Array(n).fill(false), flEv = new Array(n).fill(false), xcEv = new Array(n).fill(false);
  const tr = c.map((x, i) => (i === 0 ? h[i] - l[i] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))));
  const atr = rma(tr, 14);
  const basis = sma(c, 19);
  const std = c.map((_, i) => { if (i < 18) return null; const w = c.slice(i - 18, i + 1), m = w.reduce((s, x) => s + x, 0) / 19; return Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / 19); });
  const upper = basis.map((x, i) => (x == null ? null : x + 2 * std[i]));
  for (let i = 2; i < n; i++) {
    obEv[i] = crossU(trend, ob, i);
    outEv[i] = (crossU(trend, bb, i) && bb[i] > 75) || obEv[i];
    flEv[i] = crossU(trend, bb, i);
    if (upper[i] != null && upper[i - 1] != null && upper[i - 2] != null) xcEv[i] = h[i - 2] > upper[i - 2] && c[i - 2] > o[i - 2] && c[i - 1] < upper[i - 1] && c[i - 1] < o[i - 1] && c[i] < l[i - 1];
  }
  const bullC = new Array(n).fill(false);
  const lower = basis.map((x, i) => (x == null ? null : x - 2 * std[i]));
  for (let i = 2; i < n; i++) if (lower[i] != null && lower[i - 1] != null && lower[i - 2] != null) bullC[i] = l[i - 2] < lower[i - 2] && c[i - 2] < o[i - 2] && c[i - 1] > lower[i - 1] && c[i - 1] > o[i - 1] && c[i] > h[i - 1];
  const goi = (a, i, k = 5) => { for (let j = Math.max(0, i - k + 1); j <= i; j++) if (a[j]) return true; return false; };
  D.set(ma, { ma, n, o, h, l, c, trend, bb, atr, gt, outEv, obEv, flEv, xcEv, bullC, goi });
}
const vniMap = new Map(vni.map((b) => [b.t, b.c]));
const ketQuaBreadth = { theoNganh: new Map([...NGANH.keys()].map((k) => [k, 50])), trungBinh: 50 };
const evB = [];
for (const [ma, nenMa] of Object.entries(nen)) {
  const d = D.get(ma);
  if (!d) continue;
  let vniLast = vni[0].c;
  const vniClose = nenMa.map((b) => { vniLast = vniMap.get(b.t) ?? vniLast; return vniLast; });
  let hang;
  try { hang = tinhTinHieuChoMa({ ma, nen: nenMa, vniClose, san: "HOSE", ketQuaBreadth, thamSo: { traChuoi: true, ketThucTaiTP3: false, thoatKijunSauTP2: false } }); } catch { continue; }
  const ch = hang._chuoi;
  const r = tinhDiemMuaPhucHoi({ high: ch.high, low: ch.low, close: ch.close, volume: nenMa.map((b) => b.v), atr: ch.atr, tenkan: ch.tenkan, kijun: ch.kijun, cloudTop: ch.cloudTop, cbTop: ch.cbTop, open: ch.open });
  d.kijun = ch.kijun;
  d.ma50 = sma(ch.close, 50);
  d.t = nenMa.map((b) => b.t);
  for (let i = 0; i < d.n - 1; i++) if (r.laB[i]) { const m = r.moTa(i); if (m.sl > 0 && m.tp1 > 0) evB.push({ d, i, m }); }
}
console.log(`Diem B (giam 20-30%): ${evB.length} lenh; co KL day >= 2x TB20: ${evB.filter((e) => e.m.klDay >= 2).length}`);

function sim(e, cfg) {
  const { d, i, m } = e;
  const vao = i + 1, banTu = i + 3;
  if (vao >= d.n) return null;
  const E = d.o[vao];
  if (!(E > 0)) return null;
  const atr = d.atr[i];
  const SL = cfg.atr ? d.c[i] - 1.5 * atr : m.sl;
  if (!(SL < E) || (cfg.atr && !(atr > 0))) return null;
  const tps = [m.tp1, m.tp2, m.tp3];
  const mocs = (cfg.moc ?? []).map((x) => ({ w: x.w, gia: x.atr ? d.c[i] + x.atr * atr : tps[x.i], xong: false })).filter((x) => x.gia > E);
  let conLai = 1, thu = 0, bars = 0, cho = false, armedM = false;
  const ban = (w, g, j) => { w = Math.min(w, conLai); if (!(w > 0)) return; thu += (w * g) / E; bars += w * (j - vao); conLai -= w; };
  const ket = () => ({ ret: (thu - 1) * 100 - CP, bars });
  const sigClose = (j) => (cfg.kijun && d.kijun[j] != null && d.c[j] < d.kijun[j]) || (cfg.ma50 && armedM && d.ma50[j] != null && d.c[j] < d.ma50[j]);
  const sigOpen = (j) => (cfg.out ?? []).some((k) => d[k][j - 1]);
  const cuoi = Math.min(d.n - 1, vao + cfg.toiDa);
  for (let j = vao; j <= cuoi; j++) {
    if (j < banTu) {
      if (d.l[j] <= SL || sigClose(j) || sigOpen(j)) cho = true;
      if (d.ma50[j] != null && d.c[j] > d.ma50[j]) armedM = true;
      continue;
    }
    if (j === banTu && cho) { ban(conLai, d.o[j], j); return ket(); }
    for (const x of mocs) if (!x.xong && d.o[j] >= x.gia) { ban(x.w, d.o[j], j); x.xong = true; }
    if (conLai <= 1e-12) return ket();
    if (sigOpen(j)) { ban(conLai, d.o[j], j); return ket(); }
    if (d.l[j] <= SL) { ban(conLai, Math.min(d.o[j], SL), j); return ket(); }
    if (sigClose(j)) { ban(conLai, d.c[j], j); return ket(); }
    for (const x of mocs) if (!x.xong && d.h[j] >= x.gia) { ban(x.w, x.gia, j); x.xong = true; }
    if (conLai <= 1e-12) return ket();
    if (d.ma50[j] != null && d.c[j] > d.ma50[j]) armedM = true;
  }
  ban(conLai, d.c[cuoi], cuoi);
  return ket();
}
const CACH = [
  ["--- CACH CHOT LOI / QUAN LY (SL, TP1-3 cua engine) ---", null],
  ["B1  SL, giu co dinh 20 phien (khong TP)", { toiDa: 20 }],
  ["B2  SL, giu co dinh 60 phien (khong TP)", { toiDa: 60 }],
  ["B3  SL + chot het o TP1 (khong cham giu 20 phien)", { moc: [{ w: 1, i: 0 }], toiDa: 20 }],
  ["B4  SL + 1/3 TP1, 1/3 TP2, 1/3 TP3 (con lai giu 60 phien)", { moc: [{ w: 1 / 3, i: 0 }, { w: 1 / 3, i: 1 }, { w: 1 / 3, i: 2 }], toiDa: 60 }],
  ["B5  SL + 50% TP1, 50% giu 60 phien", { moc: [{ w: 0.5, i: 0 }], toiDa: 60 }],
  ["B6  SL + 30% TP1 + 30% TP2, con lai thoat khi dong cua < Kijun (toi da 120)", { moc: [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }], kijun: true, toiDa: 120 }],
  ["B7  SL + thoat het khi dong cua < MA50 sau khi tung tren (toi da 120)", { ma50: true, toiDa: 120 }],
  ["B8  SL + 30% TP1 + 30% TP2, con lai thoat khi dong cua < MA50 (toi da 120)", { moc: [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }], ma50: true, toiDa: 120 }],
  ["--- CO TIN HIEU PINE ---", null],
  ["P1  SL + thang TP1/TP2/TP3 + OUT thoat het (mo cua), toi da 60", { moc: [{ w: 1 / 3, i: 0 }, { w: 1 / 3, i: 1 }, { w: 1 / 3, i: 2 }], out: ["outEv"], toiDa: 60 }],
  ["P2  SL + OUT thoat het thay TP (toi da 60)", { out: ["outEv"], toiDa: 60 }],
  ["P3  SL + XC (nen giam xac nhan) thoat het (toi da 60)", { out: ["xcEv"], toiDa: 60 }],
  ["P4  SL + 30% TP1 + 30% TP2, con lai thoat theo OUT (toi da 120)", { moc: [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }], out: ["outEv"], toiDa: 120 }],
  ["P5  ATR Pine: chot het 3 ATR, cat lo 1,5 ATR (toi da 60)", { atr: true, moc: [{ w: 1, atr: 3 }], toiDa: 60 }],
  ["P6  SL + 50% chot 3 ATR, con lai giu 60 phien", { moc: [{ w: 0.5, atr: 3 }], toiDa: 60 }],
];
const KY = (e) => (e.d.t[e.i] < "2022-05-01" ? 0 : 1);
function in1(ten, cfg, ds) {
  if (!cfg) { console.log("\n" + ten); return; }
  const out = [];
  for (const kyF of [() => true, (e) => KY(e) === 0, (e) => KY(e) === 1]) {
    const r = ds.filter(kyF).map((e) => sim(e, cfg)).filter(Boolean);
    out.push(`${f(tb(r.map((x) => x.ret)), 2).padStart(6)} ${f(md(r.map((x) => x.ret)), 1).padStart(5)} ${f((r.filter((x) => x.ret > 0).length / r.length) * 100, 0).padStart(3)}% ${f(tb(r.map((x) => x.bars)), 0).padStart(3)}p`);
  }
  console.log(ten.padEnd(88), out.join(" | "));
}
console.log("\nCot: lai TB % / lenh, trung vi, thang %, so phien giu TB   (tat ca | <2022.5 | >=2022.5)");
console.log("=========== TAT CA DIEM B ===========");
for (const [ten, cfg] of CACH) in1(ten, cfg, evB);
console.log("\n=========== CHI DIEM B CO KL DAY >= 2x TB20 (yeu to kiem chung tot nhat) ===========");
for (const [ten, cfg] of CACH) in1(ten, cfg, evB.filter((e) => e.m.klDay >= 2));
