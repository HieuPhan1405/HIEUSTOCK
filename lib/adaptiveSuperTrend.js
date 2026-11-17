// ML ADAPTIVE SUPERTREND (mo phong chi bao "Machine Learning Adaptive SuperTrend" cua AlgoAlpha tren TradingView):
//   ATR(10) cua 100 nen gan nhat chia 3 cum bang K-means 1 chieu (tam ban dau = thap nhat + (cao nhat - thap nhat) x 0,75 / 0,5 / 0,25);
//   SuperTrend (he so 3) dung TAM CUM cua ATR hien tai thay vi ATR. So tren nen: 3 = bien dong cao, 2 = vua, 1 = thap.
// Kiem dinh 17/11/2026 (engine/dich-vu/nghienCuuAdaptiveSuperTrend.mjs): mua / ban theo doi chieu KHONG hon SuperTrend thuong; chot khi 3 -> 2 lam te hon.
// Diem A roi vao luc "so 3" tot hon ~+1,1%/lenh ca 2 giai doan, nhung tuong duong "ATR dang no" (hang ATR 100 phien >= 2/3) - chi la tham khao.
const TRAIN = 100;

function rma(x, n) {
  const o = new Array(x.length).fill(null);
  let s = 0, k = 0;
  for (let i = 0; i < x.length; i++) {
    if (k < n) {
      s += x[i];
      k++;
      if (k === n) o[i] = s / n;
    } else o[i] = (o[i - 1] * (n - 1) + x[i]) / n;
  }
  return o;
}

function atr(high, low, close, n) {
  const tr = high.map((h, i) => (i === 0 ? h - low[i] : Math.max(h - low[i], Math.abs(h - close[i - 1]), Math.abs(low[i] - close[i - 1]))));
  return rma(tr, n);
}

// K-means 1 chieu nhu ban Pine: gan theo khoang cach NHO HON HAN (bang nhau thi bo qua), lap toi khi tam khong doi.
function kmeans(vol, t) {
  let up = -Infinity, lo = Infinity;
  for (let q = t - TRAIN + 1; q <= t; q++) {
    up = Math.max(up, vol[q]);
    lo = Math.min(lo, vol[q]);
  }
  let m = [lo + (up - lo) * 0.75, lo + (up - lo) * 0.5, lo + (up - lo) * 0.25];
  let sz = [0, 0, 0];
  for (let it = 0; it < 100; it++) {
    const s = [0, 0, 0], k = [0, 0, 0];
    for (let q = t - TRAIN + 1; q <= t; q++) {
      const d = m.map((c) => (Number.isFinite(c) ? Math.abs(vol[q] - c) : NaN));
      for (let j = 0; j < 3; j++) {
        const o1 = d[(j + 1) % 3], o2 = d[(j + 2) % 3];
        if (Number.isFinite(d[j]) && !(d[j] >= o1) && !(d[j] >= o2)) {
          s[j] += vol[q];
          k[j]++;
        }
      }
    }
    const moi = s.map((x, j) => (k[j] ? x / k[j] : NaN));
    sz = k;
    const xong = moi.every((x, j) => x === m[j] || (Number.isNaN(x) && Number.isNaN(m[j])));
    m = moi;
    if (xong) break;
  }
  return { m, sz };
}

// Tra ve theo tung nen: st (gia duong SuperTrend), huong (1 = tang, -1 = giam), so (3 / 2 / 1), tam [cao, vua, thap], co [so diem cum cao, vua, thap], atr.
export function adaptiveSuperTrend(high, low, close, { atrLen = 10, heSo = 3 } = {}) {
  const N = close.length;
  const vol = atr(high, low, close, atrLen);
  const st = new Array(N).fill(null), huong = new Array(N).fill(null), so = new Array(N).fill(null), tam = new Array(N).fill(null), co = new Array(N).fill(null);
  let pU = null, pL = null, truocCoAtr = false;
  for (let t = 0; t < N; t++) {
    let a = null;
    if (t >= TRAIN - 1 && vol[t] > 0 && vol[t - TRAIN + 1] != null) {
      const { m, sz } = kmeans(vol, t);
      const d = m.map((x) => (Number.isFinite(x) ? Math.abs(vol[t] - x) : Infinity));
      const j = d.indexOf(Math.min(...d));
      a = m[j];
      so[t] = 3 - j;
      tam[t] = m;
      co[t] = sz;
    }
    if (a == null) {
      truocCoAtr = false;
      continue;
    }
    const src = (high[t] + low[t]) / 2;
    let U = src + heSo * a, L = src - heSo * a;
    const prevL = pL ?? 0, prevU = pU ?? 0;
    L = L > prevL || close[t - 1] < prevL ? L : prevL;
    U = U < prevU || close[t - 1] > prevU ? U : prevU;
    let d;
    if (!truocCoAtr) d = 1;
    else if (st[t - 1] === pU) d = close[t] > U ? -1 : 1;
    else d = close[t] < L ? 1 : -1;
    st[t] = d === -1 ? L : U;
    huong[t] = -d; // Pine: -1 = tang -> doi sang 1 = tang cho de doc
    pU = U;
    pL = L;
    truocCoAtr = true;
  }
  return { st, huong, so, tam, co, atr: vol };
}
