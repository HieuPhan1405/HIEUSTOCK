// DONG TIEN "BANKER FUND FLOW" (Pine: [blackcat] L3 Banker Fund Flow Trend Oscillator, tham so mac dinh) - ham THUAN, dung chung cho engine (nhan diem B) va bieu do web. Test tay: engine/test/dongTienBanker.test.mjs.
// trend  = (3 x fast - 2 x slow - 50) x 1,032 + 50, fast / slow = trung binh gia quyen (kieu SMA(X, N, M) cua TDX, N = 5 / 3, M = 1) cua stochastic tho 27 phien;
// bb     = EMA 13 cua vi tri gia dien hinh (2C + H + L + O) / 5 trong bien do 34 phien (duong "bull/bear").
// Trang thai dung cho nhan diem B: trend > bb = "dong tien da quay len" (green); nguoc lai = "con yeu". Ket qua kiem chung (engine/dich-vu/nghienCuuChiBaoVoiDiemAB.mjs, 04/11/2026): diem B (giam 20-30%) khi green lai 20 phien +2,5% so voi +1,1% khi khong green
// (tu 2022.5: +1,7% so voi -1,5%), green tot hon o 12 / 14 nam. KHONG phai tin hieu mua / ban - chi la thong tin tham khao.
// Mang vao: { open, high, low, close } cung do dai; ra: { trend, bb } cung do dai, null cho nen chua du du lieu.

const hhv = (a, n) => a.map((_, i) => { if (i < n - 1) return null; let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; });
const llv = (a, n) => a.map((_, i) => { if (i < n - 1) return null; let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; });

// ta.ema cua Pine: gia tri dau = SMA cua n gia tri hop le dau tien, sau do de quy
function ema(a, n) {
  const o = new Array(a.length).fill(null);
  const k = 2 / (n + 1);
  let dem = 0, tong = 0, truoc = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] == null) { truoc = null; dem = 0; tong = 0; continue; }
    if (truoc == null) {
      dem++;
      tong += a[i];
      if (dem === n) { truoc = tong / n; o[i] = truoc; }
      continue;
    }
    truoc = k * a[i] + (1 - k) * truoc;
    o[i] = truoc;
  }
  return o;
}

// calculate_weighted_simple_average cua blackcat: tong truot `length` gia tri; gia tri dau = trung binh, sau do (src x w + truoc x (length - w)) / length
function tbGiaQuyen(src, length, trongSo) {
  const n = src.length;
  const tong = new Array(n).fill(null);
  const ra = new Array(n).fill(null);
  for (let t = 0; t < n; t++) {
    const truoc = t > 0 && tong[t - 1] != null ? tong[t - 1] : 0;
    const tru = t - length >= 0 && src[t - length] != null ? src[t - length] : 0;
    tong[t] = src[t] == null ? null : truoc - tru + src[t];
    const tbDau = t - length < 0 || src[t - length] == null || tong[t] == null ? null : tong[t] / length;
    const raTruoc = t > 0 ? ra[t - 1] : null;
    ra[t] = raTruoc == null ? tbDau : src[t] == null ? null : (src[t] * trongSo + raTruoc * (length - trongSo)) / length;
  }
  return ra;
}

export function tinhDongTienBanker({ open, high, low, close }) {
  const n = close.length;
  if (!n) return { trend: [], bb: [] };
  const lo27 = llv(low, 27), hi27 = hhv(high, 27), lo34 = llv(low, 34), hi34 = hhv(high, 34);
  const tho = close.map((c, i) => (lo27[i] == null || hi27[i] === lo27[i] ? null : ((c - lo27[i]) / (hi27[i] - lo27[i])) * 100));
  const nhanh = tbGiaQuyen(tho, 5, 1);
  const cham = tbGiaQuyen(nhanh, 3, 1);
  const trend = nhanh.map((x, i) => (x == null || cham[i] == null ? null : (3 * x - 2 * cham[i] - 50) * 1.032 + 50));
  const dienHinh = close.map((c, i) => ((2 * c + high[i] + low[i] + (open?.[i] ?? c)) / 5));
  const bb = ema(dienHinh.map((tp, i) => (lo34[i] == null || hi34[i] === lo34[i] ? null : ((tp - lo34[i]) / (hi34[i] - lo34[i])) * 100)), 13);
  return { trend, bb };
}

// 1 = dong tien da quay len (trend > bull/bear), 0 = con yeu, null = chua du du lieu
export function trangThaiDongTien(trend, bb, i) {
  const t = trend?.[i];
  const b = bb?.[i];
  return t != null && b != null ? (t > b ? 1 : 0) : null;
}
