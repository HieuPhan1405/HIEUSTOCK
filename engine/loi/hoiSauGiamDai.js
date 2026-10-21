// HOI SAU GIAM DAI - checklist bat nhip hoi cua co phieu da giam rat lau (Hieu 2026-10-21: "cho no la 1 muc nhu checklist do day").
// Nghien cuu: engine/dich-vu/nghienCuuHoiSauGiamDai.mjs, nghienCuuCamHetNhipHoi.mjs, nghienCuuMoHinhTheoNganh.mjs, moPhongDanhMucHoiSauGiamDai.mjs.
// 4 DIEU KIEN (tai nen cuoi):
//   1. GIAM DAI: dong cua <= 65% dinh 250 phien va dinh do cach nay >= 100 phien;
//   2. GTGD TB 20 phien >= 3 ty (gia x KL / 1 trieu, gia nghin dong);
//   3. DAY SAU CAO HON: day thap nhat 30 phien gan nhat > day thap nhat 30 phien truoc do;
//   4. TREN TENKAN VA KIJUN: dong cua > Tenkan (9) va > Kijun (17).
// Du 4 dieu kien = TIN HIEU VAO (T4), mua MO CUA phien sau; moi lan cach nhau >= 20 nen va khi khong con vi the mo. CAM HET NHIP HOI: giu cho toi khi dong cua DUOI MA50 (ban mo cua phien sau), cat lo cung -10% so voi gia vao
// (low cham gia vao x 0,9). Moc tham khao them: dinh cao nhat tu luc vao - 4 x ATR14. Ham tinh lai tu dau lich su moi lan chay (vi the = ket qua cua may trang thai tren cac nen trong cua so), tra ve trang thai nen CUOI.
// LUU Y: bang chung lich su yeu (chi la danh sach theo doi) - lai TB / lenh duong nhung danh muc co gioi han vi the khong hon mua giu VN-Index; xem nghien cuu.
import { hhv, llv, sma } from "./mang.js";

export const CAU_HINH_HG = { giamToiDaTyLe: 0.65, dinhCachToiThieu: 100, gtgdToiThieuTy: 3, nenDay: 30, giuaHaiLan: 20, slPct: 10, nenDinh: 250, heSoATR: 4 };

// {open, high, low, close, volume, atr, tenkan, kijun}: cac mang cung do dai (null o nen chua du du lieu).
// Tra ve { giamDai, gtgdOk, dayCao, trenTkKj, ketLuan: 0..4 (so dieu kien dat), vaoLenh: null | { cach, giaVao, sl, ma50, ch4, canBan, tamTinh } }.
export function tinhHoiSauGiamDai({ open, high, low, close, volume, atr, tenkan, kijun }, cauHinh = CAU_HINH_HG) {
  const c = { ...CAU_HINH_HG, ...cauHinh };
  const n = close.length;
  const rong = { giamDai: null, gtgdOk: null, dayCao: null, trenTkKj: null, ketLuan: null, vaoLenh: null };
  if (n < c.nenDinh + c.nenDay * 2) return rong;
  const dinh250 = hhv(high, c.nenDinh);
  const day30 = llv(low, c.nenDay);
  const ma50 = sma(close, 50);
  const gt = close.map((x, i) => (x * (volume[i] ?? 0)) / 1e6);
  let tong = 0;
  const gtgdTB = gt.map((x, i) => { tong += x; if (i >= 20) tong -= gt[i - 20]; return i >= 19 ? tong / 20 : null; });
  const giamDaiTai = (i) => {
    if (dinh250[i] == null || !(close[i] <= c.giamToiDaTyLe * dinh250[i])) return false;
    let iP = i;
    for (let j = i - c.nenDinh + 1; j <= i; j++) if (high[j] === dinh250[i]) iP = j;
    return i - iP >= c.dinhCachToiThieu;
  };
  const dieuKien = (i) => {
    const giamDai = giamDaiTai(i);
    const gtgdOk = gtgdTB[i] != null && gtgdTB[i] >= c.gtgdToiThieuTy;
    const dayCao = i - 2 * c.nenDay + 1 >= 0 && day30[i] != null && day30[i - c.nenDay] != null && day30[i] > day30[i - c.nenDay];
    const trenTkKj = tenkan[i] != null && kijun[i] != null && close[i] > tenkan[i] && close[i] > kijun[i];
    return { giamDai, gtgdOk, dayCao, trenTkKj };
  };

  let ultVao = -Infinity, dongDen = -1, vt = null;
  for (let i = c.nenDinh + c.nenDay; i < n; i++) {
    // dang giu: kiem tra thoat tai nen i (cat lo bang low trong nen, tin hieu thoat bang dong cua duoi MA50)
    if (vt && i > vt.iV) {
      if (low[i] <= vt.giaVao * (1 - c.slPct / 100)) { dongDen = i; vt = null; }
      else {
        vt.hi = Math.max(vt.hi, high[i]);
        if (ma50[i] != null && close[i] < ma50[i]) {
          if (i + 1 < n) { dongDen = i + 1; vt = null; }
          else vt.canBan = true;
        }
      }
    }
    if (vt) continue;
    if (i + 1 <= dongDen || i - ultVao < c.giuaHaiLan) continue;
    const d = dieuKien(i);
    if (d.giamDai && d.gtgdOk && d.dayCao && d.trenTkKj) {
      ultVao = i;
      const coNenSau = i + 1 < n;
      // iV = nen tin hieu: SL / thoat duoc kiem tra tu nen vao lenh (i + 1) tro di, nhu mo phong nghien cuu
      vt = { iTinHieu: i, iV: i, giaVao: coNenSau ? open[i + 1] : close[i], tamTinh: !coNenSau, hi: coNenSau ? high[i + 1] : high[i], canBan: false };
    }
  }
  const d = dieuKien(n - 1);
  const ketLuan = [d.giamDai, d.gtgdOk, d.dayCao, d.trenTkKj].filter(Boolean).length;
  const a = atr[n - 1];
  return {
    ...d,
    ketLuan,
    vaoLenh: vt
      ? { cach: n - 1 - vt.iTinHieu, giaVao: vt.giaVao, sl: vt.giaVao * (1 - c.slPct / 100), ma50: ma50[n - 1], ch4: a != null ? vt.hi - c.heSoATR * a : null, canBan: vt.canBan, tamTinh: vt.tamTinh }
      : null,
  };
}
