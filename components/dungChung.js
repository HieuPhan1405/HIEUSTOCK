// Hang so + ham dinh dang dung chung cho ca 3 trang (tong quan, lenh mo, chi
// tiet ma). Du lieu that tu AmiBroker co the thieu (ma moi len san, chua du
// du lieu lich su de tinh chi bao) - moi ham phai an toan voi null/undefined/NaN.

export const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
`;

export function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  // Gia CP VN co buoc gia le (0.01-0.1 nghin dong) - lam tron ve so nguyen
  // (Math.round) xoa mat phan thap phan, khien Gia mua/Gia hien tai gan nhau
  // (vd 14.05 va 14.6) hien ra giong het nhau la "14"/"15". Giu toi da 2 chu
  // so thap phan, bo so 0 thua (243 -> "243", khong phai "243.00").
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n));
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

// Phan loai xu huong theo TrendScore (da tinh san trong AFL) - dung chung
// cho trang chu (do rong thi truong) va Bo loc co phieu.
export function phanLoaiXuHuong(row) {
  if (row.trend === null || row.trend === undefined) return "sideway";
  if (row.trend > 0.5) return "xanh";
  if (row.trend < -0.5) return "do";
  return "sideway";
}

// Muc TP cao nhat (dong bang tai luc mua) ma gia hien tai da cham toi - dung
// chung cho trang chu, Bo loc co phieu, va Bang lenh mo.
export function chamTPCaoNhat(row) {
  if (row.gia == null) return null;
  if (row.tp3 != null && row.gia >= row.tp3) return "TP3";
  if (row.tp2 != null && row.gia >= row.tp2) return "TP2";
  if (row.tp1 != null && row.gia >= row.tp1) return "TP1";
  return null;
}

// % lai da THUC SU co the chot duoc tai muc TP CAO NHAT da cham (so voi gia
// mua) - KHAC lai_lo_pct (tinh theo gia HIEN TAI, co the da doi tiep sau khi
// cham TP). Null neu chua cham TP nao hoac thieu du lieu gia mua.
export function pctChotLoi(row) {
  const tp = chamTPCaoNhat(row);
  if (!tp || row.gia_mua == null) return null;
  const giaTP = row[tp.toLowerCase()];
  if (giaTP == null) return null;
  return (giaTP / row.gia_mua - 1) * 100;
}

// Muc max ly thuyet cua tung thanh phan diem, lay dung theo cong thuc trong
// amibroker/7_Export_LenWeb.afl.
export const TREND_MAX = 3.0; // IIf(...,1) + IIf(...,1) + IIf(...,0.5) + IIf(...,0.5)
export const MOM_MAX = 0.5;
export const DT_MAX = 1.0; // gan dung, MFScore toi da ly thuyet la 1.0 (min -0.8)
export const RS_MAX = 20; // % so voi VNI trong 20 phien, dung lam thang tham khao
