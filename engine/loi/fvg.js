// Port AFL dong 172-208: Fair Value Gap (khoang trong gia). 1 FVG "tang" hinh thanh khi
// H[i-2] < L[i] (khoang trong giua 2 nen). Vung [H[i-2], L[i]] con hieu luc cho toi khi gia
// quay lai lap day (L[j] < gapBot) hoac het han sau FVGLookback phien.
// { high, low, close } + atr (mang) -> { inFVGZone, doLonSoATR } (mang boolean/so, cung do dai).
export function tinhFVG({ high, low, close, atr }, { fvgLookback = 15 } = {}) {
  const n = high.length;
  const inFVGZone = new Array(n).fill(false);
  const doLonSoATR = new Array(n).fill(0);

  for (let i = 2; i < n; i++) {
    if (!(high[i - 2] < low[i])) continue;
    const gapBot = high[i - 2];
    const gapTop = low[i];
    const gapSize = gapTop - gapBot;
    const atrLucHinhThanh = atr[i];
    const tySoLonATR = atrLucHinhThanh > 0 ? gapSize / atrLucHinhThanh : 0;
    const expireAt = Math.min(i + fvgLookback, n - 1);
    for (let j = i; j <= expireAt; j++) {
      if (low[j] < gapBot) break; // gia da lap day khoang trong -> FVG het hieu luc tu day tro di
      const trongVung = (low[j] <= gapTop && low[j] >= gapBot) || (close[j] <= gapTop && close[j] >= gapBot);
      if (trongVung) {
        inFVGZone[j] = true;
        if (tySoLonATR > doLonSoATR[j]) doLonSoATR[j] = tySoLonATR;
      }
    }
  }
  return { inFVGZone, doLonSoATR };
}

// FVGDuLon = ty le lon/ATR >= nguong (mac dinh 0.6, da chot chinh thuc trong AFL).
export function fvgDuLon(doLonSoATR, nguong = 0.6) {
  return doLonSoATR.map((v) => v >= nguong);
}
