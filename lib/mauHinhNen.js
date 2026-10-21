// NHAN DIEN MAU HINH NEN NHAT (candlestick) - ham THUAN, khong import "@/" (dung chung cho engine real-time (cot bo loc nen_<khoa>), trang Bieu do (danh dau len hinh) va test tay: engine/test/mauHinhNen.test.mjs).
// Dau vao: bars = [{ t, o, h, l, c, v }] tang dan thoi gian (nen ngay hoac tuan). Mau hinh "hoan thanh" tai nen DONG CUA cuoi cung cua mau hinh (1 - 3 nen).
// Dau ra: [{ khoa, ten, huong (+1 tang / -1 giam / 0 trung tinh), i (nen cuoi), cach (so nen tu nen do den nen cuoi, 0 = nen cuoi), t, nen (so nen cua mau hinh) }].
// Mau hinh DAO CHIEU can bo canh xu huong truoc do: tang chi tinh sau nhip GIAM, giam chi tinh sau nhip TANG (nhip = gia dong cua nen dau mau hinh duoi / tren SMA10 va thap / cao hon 5 nen truoc >= 2%).
// Nguong chung: "nen dai" = than >= 0,6 lan bien do TB 20 nen; "than nho" = than <= 0,3 lan bien do TB 20 nen; bong "dai" = >= 2 lan than.
// LUU Y: day la mo ta DANG nen, khong phai tin hieu mua / ban - ket qua lich su o THONG_KE_MAU_HINH_NEN (engine/dich-vu/backtestMauHinhNen.mjs) chi mang tinh tham khao.

export const MAU_HINH_NEN = [
  { khoa: "bua", ten: "Búa", huong: 1, nen: 1 },
  { khoa: "bua_nguoc", ten: "Búa ngược", huong: 1, nen: 1 },
  { khoa: "doji_chuon_chuon", ten: "Doji chuồn chuồn", huong: 1, nen: 1 },
  { khoa: "nhan_chim_tang", ten: "Nhấn chìm tăng", huong: 1, nen: 2 },
  { khoa: "xuyen_thau", ten: "Xuyên thấu", huong: 1, nen: 2 },
  { khoa: "harami_tang", ten: "Harami tăng", huong: 1, nen: 2 },
  { khoa: "day_nhip", ten: "Đáy nhíp", huong: 1, nen: 2 },
  { khoa: "sao_mai", ten: "Sao mai", huong: 1, nen: 3 },
  { khoa: "ba_linh_tang", ten: "Ba chàng lính", huong: 1, nen: 3 },
  { khoa: "sao_bang", ten: "Sao băng", huong: -1, nen: 1 },
  { khoa: "nguoi_treo", ten: "Người treo cổ", huong: -1, nen: 1 },
  { khoa: "doji_bia_mo", ten: "Doji bia mộ", huong: -1, nen: 1 },
  { khoa: "nhan_chim_giam", ten: "Nhấn chìm giảm", huong: -1, nen: 2 },
  { khoa: "may_den", ten: "Mây đen che phủ", huong: -1, nen: 2 },
  { khoa: "harami_giam", ten: "Harami giảm", huong: -1, nen: 2 },
  { khoa: "dinh_nhip", ten: "Đỉnh nhíp", huong: -1, nen: 2 },
  { khoa: "sao_hom", ten: "Sao hôm", huong: -1, nen: 3 },
  { khoa: "ba_qua_den", ten: "Ba con quạ đen", huong: -1, nen: 3 },
  { khoa: "doji", ten: "Doji (lưỡng lự)", huong: 0, nen: 1 },
];
export const KHOA_MAU_HINH_NEN = MAU_HINH_NEN.map((m) => m.khoa);
export const COT_MAU_HINH_NEN = KHOA_MAU_HINH_NEN.map((k) => `nen_${k}`);
export const SO_NEN_MAU_HINH_NEN = 5;
const TEN = Object.fromEntries(MAU_HINH_NEN.map((m) => [m.khoa, m]));

// Cac ham dung 1 nen / nhieu nen: tra ve true / false. `ctx` = { avg (bien do TB 20 nen), tang(k), giam(k) } cua chuoi.
const than = (b) => Math.abs(b.c - b.o);
const bien = (b) => b.h - b.l;
const bongTren = (b) => b.h - Math.max(b.o, b.c);
const bongDuoi = (b) => Math.min(b.o, b.c) - b.l;
const xanh = (b) => b.c > b.o;
const do_ = (b) => b.c < b.o;
const dai = (b, avg) => than(b) >= 0.6 * avg;
const nho = (b, avg) => than(b) <= 0.3 * avg;
const THAN_TOI_THIEU = 1e-9;

const KIEM = {
  // ---- 1 nen ----
  bua: (b, _a, avg, c) => bien(b) >= 0.8 * avg && than(b) > THAN_TOI_THIEU && bongDuoi(b) >= 2 * than(b) && bongTren(b) <= 0.3 * than(b) + 0.05 * bien(b) && Math.min(b.o, b.c) >= b.l + 0.6 * bien(b) && c.giam(0),
  bua_nguoc: (b, _a, avg, c) => bien(b) >= 0.8 * avg && than(b) > THAN_TOI_THIEU && bongTren(b) >= 2 * than(b) && bongDuoi(b) <= 0.3 * than(b) + 0.05 * bien(b) && Math.max(b.o, b.c) <= b.l + 0.4 * bien(b) && c.giam(0),
  doji_chuon_chuon: (b, _a, avg, c) => bien(b) >= 0.8 * avg && than(b) <= 0.1 * bien(b) && bongDuoi(b) >= 0.66 * bien(b) && bongTren(b) <= 0.1 * bien(b) && c.giam(0),
  sao_bang: (b, _a, avg, c) => bien(b) >= 0.8 * avg && than(b) > THAN_TOI_THIEU && bongTren(b) >= 2 * than(b) && bongDuoi(b) <= 0.3 * than(b) + 0.05 * bien(b) && Math.max(b.o, b.c) <= b.l + 0.4 * bien(b) && c.tang(0),
  nguoi_treo: (b, _a, avg, c) => bien(b) >= 0.8 * avg && than(b) > THAN_TOI_THIEU && bongDuoi(b) >= 2 * than(b) && bongTren(b) <= 0.3 * than(b) + 0.05 * bien(b) && Math.min(b.o, b.c) >= b.l + 0.6 * bien(b) && c.tang(0),
  doji_bia_mo: (b, _a, avg, c) => bien(b) >= 0.8 * avg && than(b) <= 0.1 * bien(b) && bongTren(b) >= 0.66 * bien(b) && bongDuoi(b) <= 0.1 * bien(b) && c.tang(0),
  doji: (b, _a, avg) => bien(b) >= 0.6 * avg && than(b) <= 0.05 * bien(b),
  // ---- 2 nen (a = nen truoc, b = nen cuoi) ----
  nhan_chim_tang: (b, a, avg, c) => do_(a) && xanh(b) && b.o <= a.c && b.c >= a.o && than(b) >= than(a) && dai(b, avg) && c.giam(1),
  nhan_chim_giam: (b, a, avg, c) => xanh(a) && do_(b) && b.o >= a.c && b.c <= a.o && than(b) >= than(a) && dai(b, avg) && c.tang(1),
  xuyen_thau: (b, a, avg, c) => do_(a) && dai(a, avg) && xanh(b) && b.o < a.c && b.c > (a.o + a.c) / 2 && b.c < a.o && c.giam(1),
  may_den: (b, a, avg, c) => xanh(a) && dai(a, avg) && do_(b) && b.o > a.c && b.c < (a.o + a.c) / 2 && b.c > a.o && c.tang(1),
  harami_tang: (b, a, avg, c) => do_(a) && dai(a, avg) && xanh(b) && than(b) <= 0.5 * than(a) && b.o >= a.c && b.c <= a.o && c.giam(1),
  harami_giam: (b, a, avg, c) => xanh(a) && dai(a, avg) && do_(b) && than(b) <= 0.5 * than(a) && b.o <= a.c && b.c >= a.o && c.tang(1),
  day_nhip: (b, a, avg, c) => do_(a) && xanh(b) && Math.abs(a.l - b.l) <= 0.1 * avg && dai(a, avg) && c.giam(1),
  dinh_nhip: (b, a, avg, c) => xanh(a) && do_(b) && Math.abs(a.h - b.h) <= 0.1 * avg && dai(a, avg) && c.tang(1),
};
// ---- 3 nen (x = nen dau, y = nen giua, z = nen cuoi) ----
const KIEM3 = {
  sao_mai: (z, y, x, avg, c) => do_(x) && dai(x, avg) && nho(y, avg) && Math.max(y.o, y.c) < x.c + 0.1 * avg && xanh(z) && z.c > (x.o + x.c) / 2 && c.giam(2),
  sao_hom: (z, y, x, avg, c) => xanh(x) && dai(x, avg) && nho(y, avg) && Math.min(y.o, y.c) > x.c - 0.1 * avg && do_(z) && z.c < (x.o + x.c) / 2 && c.tang(2),
  ba_linh_tang: (z, y, x, avg) => xanh(x) && xanh(y) && xanh(z) && y.c > x.c && z.c > y.c && y.o >= x.o && y.o <= x.c && z.o >= y.o && z.o <= y.c && than(x) >= 0.5 * avg && than(y) >= 0.5 * avg && than(z) >= 0.5 * avg && bongTren(x) <= 0.3 * than(x) && bongTren(y) <= 0.3 * than(y) && bongTren(z) <= 0.3 * than(z),
  ba_qua_den: (z, y, x, avg) => do_(x) && do_(y) && do_(z) && y.c < x.c && z.c < y.c && y.o <= x.o && y.o >= x.c && z.o <= y.o && z.o >= y.c && than(x) >= 0.5 * avg && than(y) >= 0.5 * avg && than(z) >= 0.5 * avg && bongDuoi(x) <= 0.3 * than(x) && bongDuoi(y) <= 0.3 * than(y) && bongDuoi(z) <= 0.3 * than(z),
};

// Boi canh xu huong: tang(k) / giam(k) = tai nen cach nen cuoi k nen (k = 0: nen cuoi; k = 1: nen ngay truoc ...) gia dong cua tren / duoi SMA10 va cao / thap hon 5 nen truoc >= 2%.
function chuanBi(bars) {
  const n = bars.length;
  const c = bars.map((b) => b.c);
  const sma10 = new Array(n).fill(null);
  for (let i = 9; i < n; i++) { let s = 0; for (let j = i - 9; j <= i; j++) s += c[j]; sma10[i] = s / 10; }
  const avgBien = new Array(n).fill(null);
  for (let i = 19; i < n; i++) { let s = 0; for (let j = i - 19; j <= i; j++) s += bien(bars[j]); avgBien[i] = s / 20; }
  const giamTai = (i) => i >= 5 && sma10[i] != null && c[i] < sma10[i] && c[i] <= c[i - 5] * 0.98;
  const tangTai = (i) => i >= 5 && sma10[i] != null && c[i] > sma10[i] && c[i] >= c[i - 5] * 1.02;
  return { n, avgBien, giamTai, tangTai };
}

// nhanDienMauHinhNen(bars, { tuoiToiDa: chi giu mau hinh co nen cuoi trong N nen cuoi (mac dinh het, N = 1 chi nen cuoi) })
export function nhanDienMauHinhNen(bars, { tuoiToiDa = null } = {}) {
  const { n, avgBien, giamTai, tangTai } = chuanBi(bars ?? []);
  if (n < 25) return [];
  const ra = [];
  const tu = tuoiToiDa == null ? 20 : n - tuoiToiDa;
  for (let i = Math.max(tu, 20); i < n; i++) {
    const avg = avgBien[i - 1]; // bien do TB 20 nen DEN nen ngay truoc nen xet (khong tinh chinh nen do)
    if (!(avg > 0)) continue;
    const b = bars[i];
    // boi canh tinh tai nen DAU cua mau hinh: 1 nen -> chinh no truoc do 1 nen (nen i - 1), 2 nen -> nen a (i - 1), 3 nen -> nen x (i - 2)
    const ctx = { giam: (k) => giamTai(i - 1 - k), tang: (k) => tangTai(i - 1 - k) };
    for (const m of MAU_HINH_NEN) {
      let ok = false;
      if (m.nen === 1) ok = KIEM[m.khoa](b, null, avg, ctx);
      else if (m.nen === 2) ok = KIEM[m.khoa](b, bars[i - 1], avg, ctx);
      else ok = KIEM3[m.khoa](b, bars[i - 1], bars[i - 2], avg, ctx);
      if (ok) ra.push({ khoa: m.khoa, ten: TEN[m.khoa].ten, huong: m.huong, i, cach: n - 1 - i, t: b.t, nen: m.nen });
    }
  }
  return ra;
}

// Cho bo loc: voi moi mau hinh, so nen tu nen cuoi cua mau hinh GAN NHAT den nen cuoi (0 = hom nay), hoac null neu khong co trong `tuoiToiDa` nen. { khoa: cach | null }
export function cachMauHinhNenGanNhat(bars, { tuoiToiDa = SO_NEN_MAU_HINH_NEN } = {}) {
  const kq = Object.fromEntries(KHOA_MAU_HINH_NEN.map((k) => [k, null]));
  for (const m of nhanDienMauHinhNen(bars, { tuoiToiDa })) if (kq[m.khoa] == null || m.cach < kq[m.khoa]) kq[m.khoa] = m.cach;
  return kq;
}

// Thong ke lich su (backtest engine/dich-vu/backtestMauHinhNen.mjs, ~390 ma nen ngay 2014-2026, vao MO CUA phien sau): n = so lan, r5 / r10 = lai TB 5 / 10 phien THEO HUONG mau hinh (tang: da tru phi 0,4%; giam: duong = gia giam),
// w10 = % lan co lai duong sau 10 phien, cs10 = lai TB 10 phien cua co so (moi 5 phien, moi ma, cung dieu kien thanh khoan, theo cung huong). Hau het mau hinh nen KHONG hon co so tren co phieu Viet Nam - chi nen dung de xac nhan, khong phai tin hieu.
export const THONG_KE_MAU_HINH_NEN = {"bua":{"n":3039,"r5":-1.11,"r10":-0.81,"w10":45,"cs10":0.05},"bua_nguoc":{"n":2430,"r5":0.22,"r10":0.54,"w10":50,"cs10":0.05},"doji_chuon_chuon":{"n":922,"r5":-0.77,"r10":-0.46,"w10":47,"cs10":0.05},"nhan_chim_tang":{"n":4414,"r5":-0.65,"r10":-0.69,"w10":44,"cs10":0.05},"xuyen_thau":{"n":884,"r5":-0.92,"r10":-1.98,"w10":43,"cs10":0.05},"harami_tang":{"n":3109,"r5":-0.77,"r10":-0.62,"w10":47,"cs10":0.05},"day_nhip":{"n":2284,"r5":-0.47,"r10":-0.54,"w10":48,"cs10":0.05},"sao_mai":{"n":581,"r5":-1.62,"r10":-1.66,"w10":39,"cs10":0.05},"ba_linh_tang":{"n":306,"r5":0.96,"r10":1.97,"w10":52,"cs10":0.05},"sao_bang":{"n":3356,"r5":-0.37,"r10":-0.95,"w10":48,"cs10":-0.45},"nguoi_treo":{"n":3102,"r5":-0.18,"r10":-0.99,"w10":48,"cs10":-0.45},"doji_bia_mo":{"n":769,"r5":0.23,"r10":-0.39,"w10":49,"cs10":-0.45},"nhan_chim_giam":{"n":5632,"r5":-0.74,"r10":-1.11,"w10":47,"cs10":-0.45},"may_den":{"n":1182,"r5":-0.18,"r10":-0.65,"w10":51,"cs10":-0.45},"harami_giam":{"n":2785,"r5":-0.43,"r10":-0.94,"w10":48,"cs10":-0.45},"dinh_nhip":{"n":2358,"r5":-0.35,"r10":-0.8,"w10":49,"cs10":-0.45},"sao_hom":{"n":832,"r5":-1.3,"r10":-1.29,"w10":49,"cs10":-0.45},"ba_qua_den":{"n":649,"r5":-0.86,"r10":-0.76,"w10":48,"cs10":-0.45},"doji":{"n":20657,"r5":-0.13,"r10":0.15,"w10":47,"cs10":0.05}};
