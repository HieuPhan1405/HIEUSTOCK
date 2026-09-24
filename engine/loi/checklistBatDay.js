// Port 1:1 tu amibroker/8_Export_ChecklistBatDay.afl - doi chieu tung dong voi file do khi sua.
// KHAC voi tinhTinHieuChoMa (1 dong/ma, trang thai MOI NHAT): day la NHAT KY SU KIEN - 1 ma co the
// tra ve NHIEU dong (moi dong = 1 lan checklist vuot nguong trong QUA KHU), giong AFL phai for-loop
// qua tung phien de ghi rieng tung dong dat dieu kien (khong dung LastValue()).
import { hhv, llv, sma, ref, valueWhen } from "./mang.js";
import { rsi, mfi } from "./taChiBao.js";
import { VN100 } from "../danh-sach/vn100.js";

const NGUONG_THAM_KHAO = 5;
const SO_NEN_TOI_THIEU = 260; // can du cho HHV(H,252) co y nghia, giong AFL can lich su du de bat dau tinh diem

// nen: [{t: "YYYY-MM-DD", o, h, l, c, v}] tang dan (index 0 = cu nhat) - dung chung dinh dang voi
// phan con lai cua engine (xem engine/loi/quetToanBo.js).
// Tra ve mang su kien: [{ ngay, diem, gia_luc_tin_hieu, pct_sau_5, pct_sau_10, pct_sau_20, chiet_khau, rsi, capitulation, ftd }].
export function tinhChecklistBatDay(nen, { namBatDauTheoDoi = 2024 } = {}) {
  const n = nen.length;
  if (n < SO_NEN_TOI_THIEU) return [];

  const high = nen.map((b) => b.h);
  const low = nen.map((b) => b.l);
  const close = nen.map((b) => b.c);
  const volume = nen.map((b) => b.v);

  // C1: chiet khau >= 20% so dinh 252 phien.
  const high252 = hhv(high, 252);
  const chietKhau = close.map((c, i) => (high252[i] > 0 ? ((high252[i] - c) / high252[i]) * 100 : null));
  const c1ChietKhau = chietKhau.map((v) => v != null && v >= 20);

  // C2: qua ban (RSI<35 hoac MFI<30, moi dieu kien 0.5 diem, cong don toi da 1).
  const rsiVal = rsi({ close }, 14);
  const mfiVal = mfi({ high, low, close, volume }, 14);
  const c2Oversold = close.map((_, i) => (rsiVal[i] != null && rsiVal[i] < 35 ? 0.5 : 0) + (mfiVal[i] != null && mfiVal[i] < 30 ? 0.5 : 0));

  // C3: Williams %R < -80.
  const hh14 = hhv(high, 14);
  const ll14 = llv(low, 14);
  const wpr = close.map((c, i) => (hh14[i] != null && ll14[i] != null && hh14[i] !== ll14[i] ? ((hh14[i] - c) / (hh14[i] - ll14[i])) * -100 : 0));
  const c3Wpr = wpr.map((v) => v < -80);

  // C4: gia thap hon MA200 tren 12%.
  const ma200 = sma(close, 200);
  const ma200Dev = close.map((c, i) => (ma200[i] > 0 ? ((c - ma200[i]) / ma200[i]) * 100 : 0));
  const c4Ma200 = ma200Dev.map((v) => v <= -12);

  const nhomMotDiem = close.map((_, i) => (c1ChietKhau[i] ? 1 : 0) + c2Oversold[i] + (c3Wpr[i] ? 1 : 0) + (c4Ma200[i] ? 1 : 0));

  // C6: capitulation - giam gia + khoi luong dot bien + bien do nen dot bien.
  const avgVol20 = sma(volume, 20);
  const bienDoNen = high.map((h, i) => h - low[i]);
  const avgBienDo20 = sma(bienDoNen, 20);
  const c6Capitulation = close.map(
    (c, i) => i > 0 && avgVol20[i] != null && avgBienDo20[i] != null && c < close[i - 1] && volume[i] > avgVol20[i] * 2 && bienDoNen[i] > avgBienDo20[i] * 1.5
  );

  // C7/C8: phan ky/dong thuan RSI tai day cuc bo (2 lan day gan nhat trong 20 phien).
  const day20 = llv(low, 20);
  const isLocalLow = low.map((l, i) => day20[i] != null && l === day20[i]);
  const prevLowRSI = valueWhen(isLocalLow, rsiVal, 2);
  const prevLowPrice = valueWhen(isLocalLow, low, 2);
  const c7PhanKy = low.map(
    (l, i) => isLocalLow[i] && prevLowPrice[i] != null && l < prevLowPrice[i] && rsiVal[i] != null && prevLowRSI[i] != null && rsiVal[i] > prevLowRSI[i]
  );
  const c8DaySauCaoHon = low.map((l, i) => isLocalLow[i] && prevLowPrice[i] != null && l > prevLowPrice[i]);

  const nhomHaiDiem = close.map((_, i) => (c6Capitulation[i] ? 1 : 0) + (c7PhanKy[i] ? 1 : 0) + (c8DaySauCaoHon[i] ? 1 : 0));

  // C9: follow-through day (tang manh >=1.25% kem khoi luong cao hon hom truoc, dang trong vung chiet khau >=15%).
  const tangManh = close.map((c, i) => i > 0 && c >= close[i - 1] * 1.0125 && volume[i] > volume[i - 1]);
  const dangTrongVungDay = chietKhau.map((v) => v != null && v >= 15);
  const c9Ftd = close.map((_, i) => tangManh[i] && dangTrongVungDay[i]);
  const diemFtd = c9Ftd.map((v) => (v ? 2 : 0));

  const tongDiemRiengMa = close.map((_, i) => nhomMotDiem[i] + nhomHaiDiem[i] + diemFtd[i]);

  // Tin hieu kich hoat = SU KIEN (vuot nguong DUNG NGAY hom do), khong phai trang thai giu.
  const namCuaBar = nen.map((b) => Number(b.t.slice(0, 4)));
  const chiTuNamNay = namCuaBar.map((y) => namBatDauTheoDoi <= 0 || y >= namBatDauTheoDoi);
  const tinHieuKichHoat = tongDiemRiengMa.map((d, i) => i > 0 && d >= NGUONG_THAM_KHAO && tongDiemRiengMa[i - 1] < NGUONG_THAM_KHAO && chiTuNamNay[i]);

  // Gia sau N phien: ref() voi n duong tra ve null tu nhien khi vuot qua cuoi du lieu (khac AFL can
  // fix rieng bang BarIndex/BarCount - xem chu thich trong file AFL goc).
  const gia5 = ref(close, 5);
  const gia10 = ref(close, 10);
  const gia20 = ref(close, 20);

  const ketQua = [];
  for (let i = 0; i < n; i++) {
    if (!tinHieuKichHoat[i]) continue;
    const giaLucTinHieu = close[i];
    ketQua.push({
      ngay: nen[i].t,
      diem: tongDiemRiengMa[i],
      gia_luc_tin_hieu: giaLucTinHieu,
      pct_sau_5: gia5[i] != null ? (gia5[i] / giaLucTinHieu - 1) * 100 : null,
      pct_sau_10: gia10[i] != null ? (gia10[i] / giaLucTinHieu - 1) * 100 : null,
      pct_sau_20: gia20[i] != null ? (gia20[i] / giaLucTinHieu - 1) * 100 : null,
      chiet_khau: chietKhau[i],
      rsi: rsiVal[i],
      capitulation: c6Capitulation[i],
      ftd: c9Ftd[i],
    });
  }
  return ketQua;
}

// Tinh checklist cho CA VN100 tu du lieu nen DA CO SAN trong bo nho (nenTheoMa: Map<ma, nen[]> -
// dung LAI ban tai boi taiLichSuToanBo() cho tin hieu chinh, xem engine/loi/quetToanBo.js: ca 100 ma
// VN100 da nam trong vu tru VN30+Midcap+Smallcap nen khong can fetch rieng). Tra ve mang phang
// [{ ma, ngay, diem, ... }], san sang dua thang vao xayDungCsvBatDay().
export function tinhChecklistBatDayToanBo(nenTheoMa, opts) {
  const ketQua = [];
  for (const ma of VN100) {
    const nen = nenTheoMa.get(ma);
    if (!nen) continue;
    for (const suKien of tinhChecklistBatDay(nen, opts)) ketQua.push({ ma, ...suKien });
  }
  return ketQua;
}

// "YYYY-MM-DD" -> "D/M/YYYY" (khong so 0 dau, giong NumToStr(...,1.0,False) trong AFL) - dung dinh
// dang app/api/upload-bat-day/route.js dang doi (ham soNgayVN o do).
function isoSangDMY(iso) {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

const so2 = (v) => (v == null ? "" : v.toFixed(2));
const bool01 = (v) => (v ? "1" : "0");

// dsSuKien: [{ ma, ...tinhChecklistBatDay() }] da gop tat ca ma - xuat dung 11 cot theo dung thu tu
// header app/api/upload-bat-day/route.js mong doi.
export function xayDungCsvBatDay(dsSuKien) {
  const dong = ["ma,ngay,diem,gia_luc_tin_hieu,pct_sau_5,pct_sau_10,pct_sau_20,chiet_khau,rsi,capitulation,ftd"];
  for (const s of dsSuKien) {
    dong.push(
      [s.ma, isoSangDMY(s.ngay), so2(s.diem), so2(s.gia_luc_tin_hieu), so2(s.pct_sau_5), so2(s.pct_sau_10), so2(s.pct_sau_20), so2(s.chiet_khau), so2(s.rsi), bool01(s.capitulation), bool01(s.ftd)].join(",")
    );
  }
  return dong.join("\n") + "\n";
}
