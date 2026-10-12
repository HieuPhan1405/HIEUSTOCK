// NGHIEN CUU LENH (tam): mo phong lenh MUA "mua mo cua phien sau + T+2" nhu moPhongThucTe nhung tra ve CHI TIET (nen thoat, ly do, MAE...) va cho doi cat lo / TP / thoat theo thoi gian.
import { docJson, chayEngine } from "./backtestChung.mjs";
export const CHI_PHI = 0.4;
export const tb = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
export const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "-");
export const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };

// t: lenh tu chayEngine; E = gia vao (mo cua phien sau), vao = iv + 1, banTu = iv + 3 (T+2).
export function mo(t, { E, vao, banTu, S = t.S, tp = t.tp, moc = [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }], baoVe = true, thoiGian = 0, beSauTP1 = false, ketThucTP = null }) {
  const { open, high, low, close, sell, n } = t;
  if (!(E > 0) || !(S < E)) return null;
  const cacMoc = moc.map((m) => ({ w: m.w, gia: tp[m.i], xong: false }));
  let conLai = 1, thu = 0, daTP2 = false, daTP1 = false, choBan = false, dinhTruoc = -Infinity, choLy = null;
  const ban = (w, g) => { thu += w * (g / E); conLai -= w; };
  let minLow = Infinity, maxHigh = -Infinity;
  const ra = (j, ly, g) => ({ ret: (thu - 1) * 100 - CHI_PHI, j, ly, g, mae: ((E - minLow) / E) * 100, mfe: ((maxHigh - E) / E) * 100, rSize: ((E - S) / E) * 100, tp1: daTP1 || cacMoc.some((m) => m.i === 0 && m.xong), phien: j - vao });
  for (let i = vao; i < n; i++) {
    minLow = Math.min(minLow, low[i]); maxHigh = Math.max(maxHigh, high[i]);
    if (i < banTu) {
      if (low[i] <= S) { choBan = true; choLy = "STOP"; }
      else if (sell[i]) { choBan = true; choLy = "SELL"; }
      dinhTruoc = Math.max(dinhTruoc, high[i]);
      continue;
    }
    if (i === banTu && choBan) { ban(conLai, open[i]); return ra(i, choLy + "_T2", open[i]); }
    if ((i === banTu ? dinhTruoc : high[i - 1]) >= tp[0]) daTP1 = true;
    if (baoVe && (i === banTu ? dinhTruoc : high[i - 1]) >= tp[1]) daTP2 = true;
    let stopBV = daTP2 ? E : 0;
    if (beSauTP1 && daTP1) stopBV = Math.max(stopBV, E);
    for (const m of cacMoc) if (!m.xong && open[i] >= m.gia) { ban(m.w, open[i]); m.xong = true; }
    let g = null, ly = null;
    if (low[i] <= S) { g = Math.min(open[i], S); ly = g < S * 0.995 ? "STOP_GAP" : "STOP"; }
    else if (sell[i]) { g = close[i]; ly = "SELL"; }
    else if (stopBV > 0 && low[i] <= stopBV) { g = Math.min(open[i], stopBV); ly = "BV"; }
    else if (thoiGian > 0 && i - vao >= thoiGian && conLai > 0.999) { g = close[i]; ly = "TIME"; }
    if (g != null) { if (conLai > 1e-12) ban(conLai, g); return ra(i, ly, g); }
    for (const m of cacMoc) if (!m.xong && high[i] >= m.gia) { ban(m.w, m.gia); m.xong = true; }
    if (conLai <= 1e-12) return ra(i, "TP_HET", close[i]);
  }
  return null;
}

let cacheLenh = null;
export function taiLenh() {
  if (cacheLenh) return cacheLenh;
  const cache = docJson("nen_dai.json"); const vni = docJson("vnindex_dai.json");
  const kq = chayEngine({ cache, vni });
  cacheLenh = { lenh: kq.lenh.filter((t) => [1, 2, 3].includes(t.loai) && t.iv + 3 < t.n), thiTruong: kq.thiTruong, vni };
  return cacheLenh;
}
export const vaoMo = (t, tuyChon = {}) => mo(t, { E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3, ...tuyChon });
export function boot(a, b, so = 2000) {
  let seed = 98765; const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const dl = []; for (let i = 0; i < so; i++) { let x = 0, y = 0; for (let k = 0; k < a.length; k++) x += a[Math.floor(r() * a.length)]; for (let k = 0; k < b.length; k++) y += b[Math.floor(r() * b.length)]; dl.push(x / a.length - y / b.length); }
  dl.sort((x, y) => x - y); return [dl[Math.floor(so * 0.025)], dl[Math.floor(so * 0.975)]];
}
