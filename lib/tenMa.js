// Tra ten cong ty theo ma (chi dung o server - danh sach ~1.500 ma nam trong lib/tenCongTy.js, khong dua vao goi cua trinh duyet).
import { TEN_CONG_TY } from "@/lib/tenCongTy";
import { tenChiSoNhom } from "@/lib/chiSoNhom";

// -> { ten: "Cong ty Co phan ...", ngan: "Ten ngan", san: "HOSE" } hoac null neu khong co.
export function tenCongTy(ma) {
  const m = String(ma || "").toUpperCase();
  const t = TEN_CONG_TY[m];
  return t ? { ten: t[0], ngan: t[1], san: t[2] } : tenChiSoNhom(m);
}
