// Port dung AFL amibroker/7_Export_LenWeb.afl dong 20-53, 136-139.
// Tat ca mang vao/ra: index 0 = nen CU NHAT (giong quy uoc engine/loi/mang.js).
import { hhv, llv, ref, max2, min2, zip2, sma } from "./mang.js";

const chia2 = (a, b) => zip2(a, b, (x, y) => (x + y) / 2);

// CHI NGHIEN CUU (27/10/2026, mac dinh TAT): thay duong Donchian trung diem bang trung binh dong "sma" | "ema" tren gia dong cua. kieu = "donchian" (mac dinh, nhu AFL) | "sma" | "ema".
function emaMang(a, n) {
  const k = 2 / (n + 1);
  const r = new Array(a.length).fill(null);
  let e = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] == null) { r[i] = e; continue; }
    e = e == null ? a[i] : a[i] * k + e * (1 - k);
    r[i] = i >= n - 1 ? e : null;
  }
  return r;
}
const duongTheoKieu = (kieu, len, { high, low, close }) => (kieu === "sma" ? sma(close, len) : kieu === "ema" ? emaMang(close, len) : chia2(hhv(high, len), llv(low, len)));

// { high, low }, cac do dai giong tham so AFL mac dinh: Tenkan 9, Kijun 17, SenkouB 33, Shift 26.
export function tinhIchimoku({ high, low, close }, { tenkanLen = 9, kijunLen = 17, senkouBLen = 33, shift = 26, kieuTenkanKijun = "donchian", kieuMay = "donchian" } = {}) {
  const g = { high, low, close };
  const tenkan = duongTheoKieu(kieuTenkanKijun, tenkanLen, g);
  const kijun = duongTheoKieu(kieuTenkanKijun, kijunLen, g);
  // SenkouA/B "ve truoc Shift phien": gia tri tai nen i = trung binh Tenkan/Kijun (hoac HHV/LLV
  // SenkouB) CUA SHIFT PHIEN TRUOC - dung Ref(X, -shift) trong AFL.
  const tenkanMay = kieuMay === kieuTenkanKijun ? tenkan : duongTheoKieu(kieuMay, tenkanLen, g);
  const kijunMay = kieuMay === kieuTenkanKijun ? kijun : duongTheoKieu(kieuMay, kijunLen, g);
  const senkouAGoc = chia2(tenkanMay, kijunMay);
  const senkouBGoc = kieuMay === "donchian" ? chia2(hhv(high, senkouBLen), llv(low, senkouBLen)) : duongTheoKieu(kieuMay, senkouBLen, g);
  const senkouA = ref(senkouAGoc, -shift);
  const senkouB = ref(senkouBGoc, -shift);
  const cloudTop = max2(senkouA, senkouB);
  const cloudBot = min2(senkouA, senkouB);
  return { tenkan, kijun, senkouA, senkouB, cloudTop, cloudBot, senkouAGoc, senkouBGoc };
}

// Duong can bang dai han: AFL dong 24-25, 136-139 (CB1Len=65, CB2Len=129 mac dinh).
export function tinhDuongCanBangDaiHan({ high, low, close }, { cb1Len = 65, cb2Len = 129, kieu = "donchian" } = {}) {
  const canBang1 = duongTheoKieu(kieu, cb1Len, { high, low, close });
  const canBang2 = duongTheoKieu(kieu, cb2Len, { high, low, close });
  const cbTop = max2(canBang1, canBang2);
  const cbBot = min2(canBang1, canBang2);
  return { canBang1, canBang2, cbTop, cbBot };
}
