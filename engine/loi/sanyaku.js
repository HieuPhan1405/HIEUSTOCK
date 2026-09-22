// Port AFL dong 117-124: Sanyaku Kouten - "diem chat luong" (KHONG dung de vao lenh, chi danh
// gia do chac chan cua tin hieu da co). Dem so dieu kien dat trong 3 (0..3).
import { ref, hhv } from "./mang.js";

// { high, close } + { tenkan, kijun, cloudTop } da tinh san (tu ichimoku.js) + shift (mac dinh 26).
export function tinhSanyaku({ high, close, tenkan, kijun, cloudTop }, { shift = 26 } = {}) {
  const n = close.length;
  const tenkanTruoc = ref(tenkan, -1);
  const kijunTruoc = ref(kijun, -1);
  const cloudTopTruoc = ref(cloudTop, -1);
  const closeTruoc = ref(close, -1);
  const hhv5 = hhv(high, 5);
  const hhv5LuiShift = ref(hhv5, -shift); // Chikou: gia dong cua HOM NAY so voi dinh 5 nen CUA "shift" phien truoc.

  const soDiem = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (tenkan[i] == null || kijun[i] == null) continue;
    const dk1 = tenkan[i] > kijun[i] && tenkanTruoc[i] != null && kijunTruoc[i] != null && tenkanTruoc[i] <= kijunTruoc[i];
    const duDuLieuChikou = i >= shift;
    const dk2 = duDuLieuChikou && hhv5LuiShift[i] != null && close[i] > hhv5LuiShift[i];
    const dk3 = cloudTop[i] != null && close[i] > cloudTop[i] && closeTruoc[i] != null && cloudTopTruoc[i] != null && closeTruoc[i] <= cloudTopTruoc[i];
    soDiem[i] = (dk1 ? 1 : 0) + (dk2 ? 1 : 0) + (dk3 ? 1 : 0);
  }
  return soDiem;
}
