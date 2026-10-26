// TINH RRG (Relative Rotation Graph) tren trinh duyet tu chuoi gia dong cua + chuoi benchmark (ham THUAN, import tuong doi de test: engine/test/rrgTinh.test.mjs).
//   RS = gia / benchmark ; RS-Ratio = 100 + 100*(RS / SMA(RS, n) - 1) lam muot 3 ; RS-Momentum = 100 + 100*(Ratio / Ratio m nen truoc - 1) lam muot 3, m = max(3, lam tron(0,4*n)).
// Cung cong thuc voi engine/dich-vu/tinhRRG.mjs (khung tuan, n = 10 -> m = 4). >100 / >100 = Leading, >100 / <100 = Weakening, <100 / <100 = Lagging, <100 / >100 = Improving.

const sma = (a, n, i) => {
  if (i < n - 1) return NaN;
  let s = 0;
  for (let j = i - n + 1; j <= i; j++) s += a[j];
  return s / n;
};

// dien khoang trong (null/NaN) bang gia tri truoc do; dau chuoi chua co thi giu NaN
function dienTruoc(a) {
  let g = NaN;
  return a.map((x) => {
    if (Number.isFinite(x) && x > 0) g = x;
    return g;
  });
}

const tuanCua = (t) => {
  const d = new Date(`${t}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

// gop chuoi ngay thanh chuoi tuan (dong cua cuoi tuan)
export function gopTuan(ngay, ...cacChuoi) {
  const idx = [];
  ngay.forEach((t, i) => {
    const k = tuanCua(t);
    if (idx.length && idx[idx.length - 1].k === k) idx[idx.length - 1].i = i;
    else idx.push({ k, i });
  });
  return { ngay: idx.map((x) => ngay[x.i]), chuoi: cacChuoi.map((c) => idx.map((x) => c[x.i])) };
}

export function gocRRG(ratio, mom) {
  return ratio >= 100 ? (mom >= 100 ? "Leading" : "Weakening") : mom >= 100 ? "Improving" : "Lagging";
}

// ngay: mang ngay tang dan; gia, benchmark: cung do dai. Tra ve cac diem cuoi [{ t, ratio, mom }] (toi da `duoi` + 1 diem, chi diem hop le) hoac [] neu khong du du lieu.
export function tinhRRG(ngay, gia, benchmark, { khung = "W", cuaSo = 10, duoi = 8 } = {}) {
  let t = ngay;
  let a = dienTruoc(gia);
  let b = dienTruoc(benchmark);
  if (khung === "W") {
    const g = gopTuan(ngay, a, b);
    t = g.ngay;
    [a, b] = g.chuoi;
  }
  const rs = a.map((x, i) => x / b[i]);
  const tho = rs.map((x, i) => 100 + 100 * (x / sma(rs, cuaSo, i) - 1));
  const ratio = tho.map((_, i) => sma(tho, 3, i));
  const m = Math.max(3, Math.round(cuaSo * 0.4));
  const momTho = ratio.map((x, i) => (i >= m ? 100 + 100 * (x / ratio[i - m] - 1) : NaN));
  const mom = momTho.map((_, i) => sma(momTho, 3, i));
  const kq = [];
  for (let i = t.length - 1 - duoi; i < t.length; i++) if (i >= 0 && Number.isFinite(ratio[i]) && Number.isFinite(mom[i])) kq.push({ t: t[i], ratio: +ratio[i].toFixed(2), mom: +mom[i].toFixed(2) });
  return kq;
}
