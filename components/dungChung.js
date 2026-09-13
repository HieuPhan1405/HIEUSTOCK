// Hang so + ham dinh dang dung chung cho ca 3 trang (tong quan, lenh mo, chi
// tiet ma). Du lieu that tu AmiBroker co the thieu (ma moi len san, chua du
// du lieu lich su de tinh chi bao) - moi ham phai an toan voi null/undefined/NaN.

export const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
`;

export function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

export function pct(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(Number(n).toFixed(digits));
  return `${v > 0 ? "+" : ""}${v}%`;
}

export function so1So(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

export function soAn(n, chuSo = 2) {
  return n === null || n === undefined || Number.isNaN(Number(n)) ? "—" : Number(n).toFixed(chuSo);
}

// Muc max ly thuyet cua tung thanh phan diem, lay dung theo cong thuc trong
// amibroker/7_Export_LenWeb.afl.
export const TREND_MAX = 3.0; // IIf(...,1) + IIf(...,1) + IIf(...,0.5) + IIf(...,0.5)
export const MOM_MAX = 0.5;
export const DT_MAX = 1.0; // gan dung, MFScore toi da ly thuyet la 1.0 (min -0.8)
export const RS_MAX = 20; // % so voi VNI trong 20 phien, dung lam thang tham khao
