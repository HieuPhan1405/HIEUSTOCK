// Port dung AFL amibroker/7_Export_LenWeb.afl dong 20-53, 136-139.
// Tat ca mang vao/ra: index 0 = nen CU NHAT (giong quy uoc engine/loi/mang.js).
import { hhv, llv, ref, max2, min2, zip2 } from "./mang.js";

const chia2 = (a, b) => zip2(a, b, (x, y) => (x + y) / 2);

// { high, low }, cac do dai giong tham so AFL mac dinh: Tenkan 9, Kijun 17, SenkouB 33, Shift 26.
export function tinhIchimoku({ high, low }, { tenkanLen = 9, kijunLen = 17, senkouBLen = 33, shift = 26 } = {}) {
  const tenkan = chia2(hhv(high, tenkanLen), llv(low, tenkanLen));
  const kijun = chia2(hhv(high, kijunLen), llv(low, kijunLen));
  // SenkouA/B "ve truoc Shift phien": gia tri tai nen i = trung binh Tenkan/Kijun (hoac HHV/LLV
  // SenkouB) CUA SHIFT PHIEN TRUOC - dung Ref(X, -shift) trong AFL.
  const senkouAGoc = chia2(tenkan, kijun);
  const senkouBGoc = chia2(hhv(high, senkouBLen), llv(low, senkouBLen));
  const senkouA = ref(senkouAGoc, -shift);
  const senkouB = ref(senkouBGoc, -shift);
  const cloudTop = max2(senkouA, senkouB);
  const cloudBot = min2(senkouA, senkouB);
  return { tenkan, kijun, senkouA, senkouB, cloudTop, cloudBot, senkouAGoc, senkouBGoc };
}

// Duong can bang dai han: AFL dong 24-25, 136-139 (CB1Len=65, CB2Len=129 mac dinh).
export function tinhDuongCanBangDaiHan({ high, low }, { cb1Len = 65, cb2Len = 129 } = {}) {
  const canBang1 = chia2(hhv(high, cb1Len), llv(low, cb1Len));
  const canBang2 = chia2(hhv(high, cb2Len), llv(low, cb2Len));
  const cbTop = max2(canBang1, canBang2);
  const cbBot = min2(canBang1, canBang2);
  return { canBang1, canBang2, cbTop, cbBot };
}
