// CHI BAO PHU cho bieu do (2026-10-13): EMA, RSI (Wilder), MACD, Bollinger, Stochastic (cham) - ham THUAN, test tay: engine/test/chiBaoPhu.test.mjs.
// bars: [{ h, l, c }] tang dan theo thoi gian. Gia tri chua du du nen la null. Khong anh huong chi bao Ichimoku/can bang cua he thong (lib/chiBaoKyThuat.js).

// EMA (he so 2/(n+1)), nen dau = trung binh don n nen dau tien.
export function ema(gia, n) {
  const kq = new Array(gia.length).fill(null);
  if (gia.length < n || n < 1) return kq;
  let s = 0;
  for (let i = 0; i < n; i++) s += gia[i];
  let e = s / n;
  kq[n - 1] = e;
  const k = 2 / (n + 1);
  for (let i = n; i < gia.length; i++) {
    e = gia[i] * k + e * (1 - k);
    kq[i] = e;
  }
  return kq;
}

// RSI Wilder (n mac dinh 14): trung binh tang/giam lam tron kieu Wilder; = 100 khi khong co phien giam.
export function rsi(dong, n = 14) {
  const kq = new Array(dong.length).fill(null);
  if (dong.length <= n) return kq;
  let tang = 0;
  let giam = 0;
  for (let i = 1; i <= n; i++) {
    const d = dong[i] - dong[i - 1];
    if (d >= 0) tang += d;
    else giam -= d;
  }
  tang /= n;
  giam /= n;
  const gt = () => (giam === 0 ? (tang === 0 ? 50 : 100) : 100 - 100 / (1 + tang / giam));
  kq[n] = gt();
  for (let i = n + 1; i < dong.length; i++) {
    const d = dong[i] - dong[i - 1];
    tang = (tang * (n - 1) + (d > 0 ? d : 0)) / n;
    giam = (giam * (n - 1) + (d < 0 ? -d : 0)) / n;
    kq[i] = gt();
  }
  return kq;
}

// MACD (12, 26, 9): macd = EMA12 - EMA26; signal = EMA9 cua macd; hist = macd - signal.
export function macd(dong, nhanh = 12, cham = 26, tinHieu = 9) {
  const n = dong.length;
  const e1 = ema(dong, nhanh);
  const e2 = ema(dong, cham);
  const m = dong.map((_, i) => (e1[i] != null && e2[i] != null ? e1[i] - e2[i] : null));
  const bd = m.findIndex((v) => v != null);
  const sig = new Array(n).fill(null);
  if (bd >= 0) {
    const e = ema(m.slice(bd), tinHieu);
    e.forEach((v, i) => (sig[bd + i] = v));
  }
  const hist = m.map((v, i) => (v != null && sig[i] != null ? v - sig[i] : null));
  return { macd: m, signal: sig, hist };
}

// Bollinger (20, 2 do lech chuan tong the).
export function bollinger(dong, n = 20, k = 2) {
  const mid = new Array(dong.length).fill(null);
  const tren = new Array(dong.length).fill(null);
  const duoi = new Array(dong.length).fill(null);
  for (let i = n - 1; i < dong.length; i++) {
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += dong[j];
    const tb = s / n;
    let v = 0;
    for (let j = i - n + 1; j <= i; j++) v += (dong[j] - tb) ** 2;
    const sd = Math.sqrt(v / n);
    mid[i] = tb;
    tren[i] = tb + k * sd;
    duoi[i] = tb - k * sd;
  }
  return { mid, tren, duoi };
}

// Stochastic cham (14, 3, 3): %K nhanh = (C - LLV) / (HHV - LLV) * 100, lam tron 3 = K; D = trung binh 3 cua K.
export function stochastic(bars, n = 14, lamTronK = 3, lamTronD = 3) {
  const len = bars.length;
  const nhanh = new Array(len).fill(null);
  for (let i = n - 1; i < len; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - n + 1; j <= i; j++) {
      if (bars[j].h > hh) hh = bars[j].h;
      if (bars[j].l < ll) ll = bars[j].l;
    }
    nhanh[i] = hh === ll ? 50 : ((bars[i].c - ll) / (hh - ll)) * 100;
  }
  const tbDon = (mang, m) => {
    const kq = new Array(mang.length).fill(null);
    for (let i = 0; i < mang.length; i++) {
      if (i < m - 1) continue;
      let s = 0;
      let ok = true;
      for (let j = i - m + 1; j <= i; j++) {
        if (mang[j] == null) {
          ok = false;
          break;
        }
        s += mang[j];
      }
      if (ok) kq[i] = s / m;
    }
    return kq;
  };
  const k = tbDon(nhanh, lamTronK);
  const d = tbDon(k, lamTronD);
  return { k, d };
}
