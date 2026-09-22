// Cac chi bao ky thuat kinh dien theo dung cong thuc Wilder (AmiBroker ATR()/ADX()/PDI()/MDI()/
// RSI() deu dung phuong phap lam muot Wilder, KHONG phai EMA thong thuong - neu dung nham EMA se
// cho ra so gan dung nhung LECH voi AmiBroker, dac biet ro trong 20-30 nen dau tien).
// Quy uoc: index 0 = nen CU NHAT. Cac gia tri chua du du lieu tra ve null.

// Lam muot Wilder tren 1 mang "gia tri tho" (vd True Range, +DM, gain...): gia tri muot dau tien
// (tai chi so batDau + period - 1) = trung binh cong don gian cua period gia tri tho dau tien;
// cac chi so sau: muot[i] = muot[i-1]*(period-1)/period + tho[i]/period.
function lamMuotWilder(tho, period, batDau = 0) {
  const kq = new Array(tho.length).fill(null);
  let tong = 0;
  for (let i = batDau; i < batDau + period && i < tho.length; i++) tong += tho[i];
  const viTriDau = batDau + period - 1;
  if (viTriDau >= tho.length) return kq;
  kq[viTriDau] = tong / period;
  for (let i = viTriDau + 1; i < tho.length; i++) {
    kq[i] = (kq[i - 1] * (period - 1) + tho[i]) / period;
  }
  return kq;
}

// True Range: TR[0] = H[0]-L[0] (khong co dong cua hom truoc); TR[i] = max(H-L, |H-Cprev|, |L-Cprev|).
export function trueRange({ high, low, close }) {
  const n = high.length;
  const kq = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      kq[i] = high[i] - low[i];
      continue;
    }
    kq[i] = Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1]));
  }
  return kq;
}

// ATR(period) = Wilder-smoothed True Range.
export function atr({ high, low, close }, period = 14) {
  const tr = trueRange({ high, low, close });
  return lamMuotWilder(tr, period, 0);
}

// ADX/+DI/-DI(period) - he thong Directional Movement kinh dien cua Wilder.
export function adxHeThong({ high, low, close }, period = 14) {
  const n = high.length;
  const dmPlus = new Array(n).fill(0);
  const dmMinus = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    dmPlus[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    dmMinus[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }
  const tr = trueRange({ high, low, close });
  // Lam muot tu chi so 1 (dmPlus/dmMinus[0] luon = 0, khong co y nghia - giong AmiBroker bo qua nen dau).
  const trMuot = lamMuotWilder(tr, period, 1);
  const dmPlusMuot = lamMuotWilder(dmPlus, period, 1);
  const dmMinusMuot = lamMuotWilder(dmMinus, period, 1);
  const diPlus = new Array(n).fill(null);
  const diMinus = new Array(n).fill(null);
  const dx = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (trMuot[i] == null || !(trMuot[i] > 0)) continue;
    diPlus[i] = (100 * dmPlusMuot[i]) / trMuot[i];
    diMinus[i] = (100 * dmMinusMuot[i]) / trMuot[i];
    const tongDI = diPlus[i] + diMinus[i];
    dx[i] = tongDI > 0 ? (100 * Math.abs(diPlus[i] - diMinus[i])) / tongDI : 0;
  }
  const viTriDXDau = dx.findIndex((v) => v != null);
  const adx = viTriDXDau < 0 ? new Array(n).fill(null) : lamMuotWilder(dx, period, viTriDXDau);
  return { adx, diPlus, diMinus };
}

// RSI(period) - Wilder.
export function rsi({ close }, period = 14) {
  const n = close.length;
  const gain = new Array(n).fill(0);
  const loss = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const doi = close[i] - close[i - 1];
    if (doi > 0) gain[i] = doi;
    else loss[i] = -doi;
  }
  const gainMuot = lamMuotWilder(gain, period, 1);
  const lossMuot = lamMuotWilder(loss, period, 1);
  const kq = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (gainMuot[i] == null) continue;
    if (lossMuot[i] === 0) {
      kq[i] = 100;
      continue;
    }
    const rs = gainMuot[i] / lossMuot[i];
    kq[i] = 100 - 100 / (1 + rs);
  }
  return kq;
}

// MFI(period) - Money Flow Index kinh dien: dung TONG TRUOT don gian (khong lam muot Wilder).
export function mfi({ high, low, close, volume }, period = 14) {
  const n = high.length;
  const typical = new Array(n);
  for (let i = 0; i < n; i++) typical[i] = (high[i] + low[i] + close[i]) / 3;
  const posMF = new Array(n).fill(0);
  const negMF = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const rawMF = typical[i] * volume[i];
    if (typical[i] > typical[i - 1]) posMF[i] = rawMF;
    else if (typical[i] < typical[i - 1]) negMF[i] = rawMF;
  }
  const kq = new Array(n).fill(null);
  let tongDuong = 0;
  let tongAm = 0;
  for (let i = 0; i < n; i++) {
    tongDuong += posMF[i];
    tongAm += negMF[i];
    if (i >= period) {
      tongDuong -= posMF[i - period];
      tongAm -= negMF[i - period];
    }
    if (i < period) continue; // can it nhat `period` doi thay dong gia (giong Wilder truoc, bat dau tu chi so 1)
    kq[i] = tongAm === 0 ? 100 : 100 - 100 / (1 + tongDuong / tongAm);
  }
  return kq;
}
