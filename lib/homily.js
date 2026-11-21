// Bo chi bao HOMILY CHART (弘历) - PHONG THEO ma Tongdaxin / Phi Ho cong khai (ma goc cua Homily la ma dong, khong cong khai).
// Nguon + cach doi chieu: Desktop/Homily-Code/01_NGUON_GOC_TDX_FeiHu.txt. Tat ca chi la chi bao HIEN THI / THAM KHAO:
// kiem dinh 21/11/2026 (389 ma, vao mo cua phien sau) cho thay mau nen DE / TE, giao cat 8-20, J cat 50, Taichi... KHONG co loi the thong ke rieng le.
// "DE" (背离王 = Deviation Expert) da doi chieu so: PLX 20/11/2026 = -2,987 dung nhu anh phan mem Homily.
// Quy uoc: moi ham tra mang cung do dai voi dau vao; diem chua du du lieu = null.

// EMA kieu Tongdaxin: nen dau = gia tri dau tien (khong co null o dau), he so 2 / (n + 1).
export function emaTdx(a, n) {
  const k = 2 / (n + 1);
  const o = new Array(a.length);
  let e = null;
  for (let i = 0; i < a.length; i++) {
    e = e == null ? a[i] : a[i] * k + e * (1 - k);
    o[i] = e;
  }
  return o;
}

// SMA(X, N, 1) cua Tongdaxin = trung binh mu he so 1 / N (dung trong KDJ).
export function sma1(a, n) {
  const o = new Array(a.length);
  let e = null;
  for (let i = 0; i < a.length; i++) {
    e = e == null ? a[i] : (a[i] + (n - 1) * e) / n;
    o[i] = e;
  }
  return o;
}

// FORCAST(X, N) cua Tongdaxin = diem CUOI cua duong hoi quy tuyen tinh N nen gan nhat (= ta.linreg(x, N, 0) cua Pine).
export function forcast(a, n) {
  const o = new Array(a.length).fill(null);
  let sx = 0;
  let sxx = 0;
  for (let j = 0; j < n; j++) {
    sx += j;
    sxx += j * j;
  }
  for (let i = n - 1; i < a.length; i++) {
    let sy = 0;
    let sxy = 0;
    for (let j = 0; j < n; j++) {
      const y = a[i - n + 1 + j];
      sy += y;
      sxy += j * y;
    }
    const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    o[i] = (sy - b * sx) / n + b * (n - 1);
  }
  return o;
}

export const DE_KHOI_DAU = 40; // nhung nen dau chua on dinh (EMA17 + FORCAST): khong ve

// DE = 背离王 (Deviation Expert). a_k = FORCAST(EMA(C, k), 6) voi k = 5, 8, 11, 14, 17; b = a5 + a8 + a11 + a14 - 4 * a17; towerc = EMA(b, 2).
// Moi nen DE ve tu towerc phien truoc den towerc phien nay: DO khi towerc >= phien truoc (tien vao), XANH khi giam (tien ra).
// tra { tw, len } - tw[i] null o DE_KHOI_DAU nen dau; len[i] = true neu nen do.
export function homilyDE(close, { forcastN = 6 } = {}) {
  const f = (k) => forcast(emaTdx(close, k), forcastN);
  const f5 = f(5);
  const f8 = f(8);
  const f11 = f(11);
  const f14 = f(14);
  const f17 = f(17);
  const b = close.map((_, i) => (f17[i] == null ? 0 : f5[i] + f8[i] + f11[i] + f14[i] - 4 * f17[i]));
  const t = emaTdx(b, 2);
  const tw = t.map((v, i) => (i < DE_KHOI_DAU ? null : v));
  const len = tw.map((v, i) => i > 0 && v != null && tw[i - 1] != null && v >= tw[i - 1]);
  return { tw, len };
}

// TE = 趋势王 (Trend Expert): 7 duong xu huong (moi duong = trung binh 3 EMA cua (O+H+L+C)/4, roi FORCAST 6) + "nen thap" towerc = FORCAST(EMA((3C+2O+H+L)/7, 3), 6).
export const TE_BO_EMA = [[3, 6, 9], [5, 10, 20], [7, 14, 28], [9, 18, 36], [11, 22, 44], [13, 26, 52], [21, 34, 68]];
export function homilyTE(open, high, low, close) {
  const p4 = close.map((c, i) => (open[i] + high[i] + low[i] + c) / 4);
  const duong = TE_BO_EMA.map(([a, b, c]) => {
    const A = emaTdx(p4, a);
    const B = emaTdx(p4, b);
    const C = emaTdx(p4, c);
    return forcast(A.map((v, i) => (v + B[i] + C[i]) / 3), 6);
  });
  const thap = forcast(emaTdx(close.map((c, i) => (3 * c + 2 * open[i] + high[i] + low[i]) / 7), 3), 6);
  const len = thap.map((v, i) => i > 0 && v != null && thap[i - 1] != null && v >= thap[i - 1]);
  return { duong, thap, len };
}

// KDJ (9, 3, 3) cua Tongdaxin: J cat len 50 = "强势信号" (strong signal) cua Homily; K cat len D khi D < 50 = "弱势抄底".
export function homilyKDJ(high, low, close, n = 9) {
  const rsv = close.map((c, i) => {
    let hh = -Infinity;
    let ll = Infinity;
    for (let q = Math.max(0, i - n + 1); q <= i; q++) {
      if (high[q] > hh) hh = high[q];
      if (low[q] < ll) ll = low[q];
    }
    return hh > ll ? ((c - ll) / (hh - ll)) * 100 : 50;
  });
  const k = sma1(rsv, 3);
  const d = sma1(k, 3);
  const j = k.map((v, i) => 3 * v - 2 * d[i]);
  return { k, d, j };
}

// 操盘王: b = (EMA3 + EMA6 + EMA9 cua OHLC4) / 4, d = (EMA5 + EMA10 + EMA20) / 4; b cat len d = "买", cat xuong = "卖".
export function homilyThaoBan(open, high, low, close) {
  const p4 = close.map((c, i) => (open[i] + high[i] + low[i] + c) / 4);
  const g = (x, y, z) => {
    const A = emaTdx(p4, x);
    const B = emaTdx(p4, y);
    const C = emaTdx(p4, z);
    return A.map((v, i) => (v + B[i] + C[i]) / 4);
  };
  return { b: g(3, 6, 9), d: g(5, 10, 20) };
}

// 弘历彩虹: 16 duong EMA (4 nhom mau).
export const CAI_HONG = [
  { chuKy: [6, 12, 18], mau: "#EF4444" },
  { chuKy: [24], mau: "#22C55E" },
  { chuKy: [30, 36, 42, 48], mau: "#EAB308" },
  { chuKy: [100, 112, 124, 138], mau: "#3B82F6" },
  { chuKy: [204, 216, 228, 260], mau: "#94A3B8" },
];

// Cac chi so (index nen) xay ra su kien cat: a cat len b (len) / cat xuong b (xuong). Bo qua diem null.
export function diemCat(a, b) {
  const len = [];
  const xuong = [];
  for (let i = 1; i < a.length; i++) {
    const a0 = a[i - 1];
    const a1 = a[i];
    const b0 = typeof b === "number" ? b : b[i - 1];
    const b1 = typeof b === "number" ? b : b[i];
    if (a0 == null || a1 == null || b0 == null || b1 == null) continue;
    if (a0 <= b0 && a1 > b1) len.push(i);
    else if (a0 >= b0 && a1 < b1) xuong.push(i);
  }
  return { len, xuong };
}
