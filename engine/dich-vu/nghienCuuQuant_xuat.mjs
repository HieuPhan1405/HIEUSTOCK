// NGHIEN CUU QUANT (2026-10-12): xuat bang lenh (1 dong / lenh MUA goc) + dac trung + ket qua ra CSV de huan luyen / kiem tra cuon chieu.
// Chay: node engine/dich-vu/nghienCuuQuant_xuat.mjs <duong_dan_csv>
import { writeFileSync } from "node:fs";
import { taiLenh, vaoMo } from "./nghienCuuLenh.mjs";
const dich = process.argv[2];
if (!dich) { console.log("thieu duong dan csv"); process.exit(1); }
const { lenh, thiTruong } = taiLenh();
const swing5 = (t) => Math.min(...t.low.slice(Math.max(0, t.iv - 4), t.iv + 1)) * 0.995;
const avg = (arr, a, b) => { let s = 0, n = 0; for (let k = a; k <= b; k++) { if (Number.isFinite(arr[k])) { s += arr[k]; n++; } } return n ? s / n : NaN; };
const hang = [];
for (const t of lenh) {
  const i = t.iv; if (i < 210 || !t.vol) continue;
  const E = t.open[i + 1]; const S2 = swing5(t); if (!(S2 < E * 0.995)) continue;
  const rA = vaoMo(t), rB = vaoMo(t, { S: S2 }), rC = vaoMo(t, { S: S2, moc: [] });
  if (!rA || !rB || !rC) continue;
  const c = t.close, h = t.high, l = t.low, o = t.open, v = t.vol;
  const rng = h[i] - l[i] || 1e-9, atr = t.atr[i] || 1e-9;
  const hh = (a, b) => Math.max(...h.slice(a, b + 1)), ll = (a, b) => Math.min(...l.slice(a, b + 1));
  let up = 0, dn = 0; for (let k = i - 9; k <= i; k++) { if (c[k] >= c[k - 1]) up += v[k]; else dn += v[k]; }
  const prevLow20 = ll(i - 24, i - 5), recentLow = ll(i - 4, i);
  const sma200 = avg(c, i - 199, i), sma50 = t.sma50[i];
  const bodyTop = Math.max(o[i], c[i]), bodyBot = Math.min(o[i], c[i]);
  const tt = thiTruong(t.ngayArr[i]) || {};
  const tt5 = thiTruong(t.ngayArr[i - 5]) || {}, tt20 = thiTruong(t.ngayArr[i - 20]) || {};
  const dt = t.dacTrung;
  const dac = {
    // engine
    rank: dt["Diem xep hang engine (diem_rank)"], conf: dt["Diem tin cay (diem_confidence)"], diem: dt["Tong diem luc vao (diem)"],
    adx: dt["ADX"], rs20: dt["Suc manh so voi VN-Index (RS 20 phien)"], gtgd: Math.log(Math.max(0.01, dt["GTGD TB20 (ty/phien)"])),
    // VSA / Wyckoff / nen
    relvol: t.relVol[i], clv: (c[i] - l[i]) / rng, rngAtr: rng / atr, upDn: up / (dn || 1), vol5v20: avg(v, i - 4, i) / (avg(v, i - 19, i) || 1),
    relvol5: avg(t.relVol, i - 5, i - 1), effort: (t.relVol[i] || 0) / (rng / atr || 1),
    spring: recentLow < prevLow20 && c[i] > prevLow20 ? 1 : 0, sos: c[i] > hh(i - 20, i - 1) ? 1 : 0,
    kcDinh60: (c[i] / hh(i - 59, i) - 1) * 100, nenDai: c.slice(i - 29, i + 1).filter((x) => Math.abs(x / c[i] - 1) <= 0.04).length,
    nenChat: ((hh(i - 19, i) - ll(i - 19, i)) / c[i]) * 100, atrRel: atr / (avg(t.atr, i - 49, i) || 1), atrPct: (atr / c[i]) * 100,
    sma200: (c[i] / sma200 - 1) * 100, sma50: (c[i] / sma50 - 1) * 100, thanNen: (bodyTop - bodyBot) / rng, rauTren: (h[i] - bodyTop) / rng, rauDuoi: (bodyBot - l[i]) / rng,
    engulf: c[i - 1] < o[i - 1] && c[i] > o[i] && c[i] >= o[i - 1] && o[i] <= c[i - 1] ? 1 : 0, inside: h[i] <= h[i - 1] && l[i] >= l[i - 1] ? 1 : 0,
    tang5: (c[i] / c[i - 5] - 1) * 100, tang20: (c[i] / c[i - 20] - 1) * 100, tang60: (c[i] / c[i - 60] - 1) * 100,
    kijunKc: t.kijun[i] > 0 ? (c[i] / t.kijun[i] - 1) * 100 : NaN, mayKc: t.cloudTop[i] > 0 ? (c[i] / t.cloudTop[i] - 1) * 100 : NaN, cbKc: t.cbTop[i] > 0 ? (c[i] / t.cbTop[i] - 1) * 100 : NaN,
    gap: (o[i + 1] / c[i] - 1) * 100, gapDinh: (o[i + 1] / h[i] - 1) * 100,
    rSizeB: ((E - S2) / E) * 100, rSizeA: rA.rSize, tp1R: (t.tp[0] - E) / (E - S2),
    // thi truong
    vniSma50: tt.vni && tt.sma50 ? (tt.vni / tt.sma50 - 1) * 100 : NaN, vniSma200: tt.vni && tt.sma200 ? (tt.vni / tt.sma200 - 1) * 100 : NaN,
    vni5: tt.vni && tt5.vni ? (tt.vni / tt5.vni - 1) * 100 : NaN, vni20: tt.vni && tt20.vni ? (tt.vni / tt20.vni - 1) * 100 : NaN,
    vniTrenKijun: tt.vni && tt.kijun ? (tt.vni > tt.kijun ? 1 : 0) : NaN, rong50: tt.doRong50 ?? NaN, rongKijun: tt.doRongKijun ?? NaN,
  };
  hang.push({
    ma: t.ma, ngay: t.ngayArr[i], ngayVao: t.ngayArr[i + 1], ngayThoatB: t.ngayArr[rB.j], loai: t.loai,
    rA: rA.ret / rA.rSize, retA: rA.ret, rB: rB.ret / rB.rSize, retB: rB.ret, rC: rC.ret / rC.rSize, retC: rC.ret, phienB: rB.phien,
    ...dac,
  });
}
const cot = Object.keys(hang[0]);
writeFileSync(dich, [cot.join(","), ...hang.map((r) => cot.map((k) => { const x = r[k]; return Number.isFinite(x) ? +x.toFixed(5) : (typeof x === "string" ? x : ""); }).join(","))].join("\n"));
console.log("xuat", hang.length, "lenh,", cot.length, "cot ->", dich);
process.exit(0);
