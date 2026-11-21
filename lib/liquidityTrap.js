// LIQUIDITY TRAP RADAR - chi bao quet thanh khoan (y tuong cua "Liquidity Trap Radar PRO [Thomas]", Pine v6, MPL 2.0, (c) Thomas-Sterling). Viet lai bang JS tu logic cong khai cua script.
// TRAP BUY: nen xuong thung day cua `lookback` nen truoc roi dong cua tro lai tren day, nen xanh (dong cua > mo cua); TRAP SELL doi xung. Cooldown dung chung cho ca hai chieu.
// Ke hoach lenh (nhu Pine): vao gia dong cua nen tin hieu, SL = day (dinh) nen tin hieu -/+ 0,25 ATR(14), TP1 = 1R, TP2 = 2R.
// CHI LA CHI BAO HIEN THI / THAM KHAO: kiem dinh 21/11/2026 (389 ma ngay, vao mo cua phien sau) TRAP BUY kem muc nen (10 phien -0,60 / -0,65 so voi nen +0,52 / -0,20), co SL/TP lo -0,7..-1,4%/lenh.
// Dung tren diem A: TRAP SELL trong 10 phien truoc la dau hieu NEN NE (-1,12), TRAP BUY trong 10 phien +0,97 (ung vien yeu, chua dung).

function rma(a, n) {
  const o = new Array(a.length);
  let e = null;
  for (let i = 0; i < a.length; i++) {
    e = e == null ? a[i] : (e * (n - 1) + a[i]) / n;
    o[i] = e;
  }
  return o;
}

// tra { buy, sell, signals } - buy / sell la mang bool; signals = [{ i, dir (1 mua / -1 ban), entry, sl, tp1, tp2 }]
export function liquidityTrap(open, high, low, close, { lookback = 20, cooldown = 8, atrLen = 14, atrBuffer = 0.25, tp1RR = 1, tp2RR = 2 } = {}) {
  const n = close.length;
  const tr = close.map((c, i) => (i ? Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])) : high[i] - low[i]));
  const atr = rma(tr, atrLen);
  const buy = new Array(n).fill(false);
  const sell = new Array(n).fill(false);
  const signals = [];
  let last = null;
  for (let i = lookback; i < n; i++) {
    let ph = -Infinity;
    let pl = Infinity;
    for (let q = i - lookback; q <= i - 1; q++) {
      if (high[q] > ph) ph = high[q];
      if (low[q] < pl) pl = low[q];
    }
    const upper = high[i] > ph && close[i] < ph;
    const lower = low[i] < pl && close[i] > pl;
    const cd = last == null || i - last > cooldown;
    const b = lower && close[i] > open[i] && cd;
    const s = upper && close[i] < open[i] && cd;
    buy[i] = b;
    sell[i] = s;
    if (b || s) {
      last = i;
      const dir = b ? 1 : -1;
      const sl = b ? low[i] - atr[i] * atrBuffer : high[i] + atr[i] * atrBuffer;
      const risk = Math.abs(close[i] - sl);
      if (risk > 0) signals.push({ i, dir, entry: close[i], sl, tp1: close[i] + dir * risk * tp1RR, tp2: close[i] + dir * risk * tp2RR });
    }
  }
  return { buy, sell, signals };
}
