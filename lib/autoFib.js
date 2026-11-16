// AUTO FIB EXTENSION - mo phong chi bao TradingView "Auto fib extension" (Hieu dan script 16/11/2026), Depth mac dinh 10.
// 1) Pivot cao / thap: nen i la pivot khi cao (thap) nhat trong [i - depth/2, i + depth/2]; chi BIET sau depth/2 nen. Hai pivot cung loai lien tiep -> giu cai cuc doan hon.
// 2) Lay 3 pivot cuoi A - B - C xen ke (C moi nhat). Hop le khi C hoi ve [0,236 ; 1,0] cua doan AB (C la day: A <= C <= B - 0,236.AB; C la dinh: B + 0,236.AB <= C <= A);
//    khong hop le thi bo pivot moi nhat va thu lai (nhu script goc di lui).
// 3) Cac muc = C + m.|AB| theo huong AB (C la day -> muc LEN; C la dinh -> muc XUONG).
// CHI LA CONG CU VE THAM KHAO: kiem dinh 16/11/2026 (engine/dich-vu/nghienCuuAutoFibMoRong.mjs) - dinh ke tiep nam gan mot muc 80,5% so voi 79,2% khi dat muc ngau nhien, mua tai C chot o muc: lo -0,3..-0,5%/lenh. Khong phai tin hieu.
export const MUC_FIB_MAC_DINH = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618, 3.618, 4.236];

export function timPivot(high, low, depth = 10) {
  const half = Math.max(1, Math.floor(depth / 2));
  const n = high.length, pivs = [];
  for (let j = 2 * half; j < n; j++) {
    const i = j - half;
    let isH = true, isL = true;
    for (let q = i - half; q <= j; q++) {
      if (high[q] > high[i]) isH = false;
      if (low[q] < low[i]) isL = false;
    }
    for (const [la, v, t] of [[isH, high[i], "H"], [isL, low[i], "L"]]) {
      if (!la) continue;
      const cuoi = pivs[pivs.length - 1];
      if (cuoi && cuoi.t === t) {
        if ((t === "H" && v > cuoi.v) || (t === "L" && v < cuoi.v)) { cuoi.v = v; cuoi.i = i; cuoi.conf = j; }
      } else pivs.push({ t, v, i, conf: j });
    }
  }
  return pivs;
}

// Tra ve null neu khong du pivot. { huong: 1 (muc LEN) | -1 (muc XUONG), A, B, C: {i, v}, doAB, muc: [{ m, gia }], pivots }
export function autoFibExt(high, low, { depth = 10, muc = MUC_FIB_MAC_DINH } = {}) {
  if (!high || high.length < depth * 3) return null;
  const pivs = timPivot(high, low, depth);
  for (let k = pivs.length; k >= 3; k--) {
    const C = pivs[k - 1], B = pivs[k - 2], A = pivs[k - 3];
    const ab = Math.abs(A.v - B.v);
    if (!(ab > 0)) continue;
    const len = C.t === "L"; // C la day -> AB la nhip tang (A day, B dinh)
    const hopLe = len ? C.v >= A.v && C.v <= B.v - 0.236 * ab : C.v <= A.v && C.v >= B.v + 0.236 * ab;
    if (!hopLe) continue;
    const huong = len ? 1 : -1;
    return {
      huong,
      A: { i: A.i, v: A.v },
      B: { i: B.i, v: B.v },
      C: { i: C.i, v: C.v, conf: C.conf },
      doAB: ab,
      muc: muc.map((m) => ({ m, gia: C.v + huong * m * ab })),
    };
  }
  return null;
}
