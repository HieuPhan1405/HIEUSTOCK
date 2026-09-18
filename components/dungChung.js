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

// Khoi luong TB20 (co phieu) - dung SO CO PHIEU truc tiep (khop dung cach
// he thong xet "an toan thanh khoan" trong AFL: MA(V,20) >= 100.000 cp),
// thay vi gia tri giao dich quy doi ra tien (de nham lan don vi truoc day).
export function chuoiKhoiLuong(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K cp`;
  return `${n.toFixed(0)} cp`;
}

// Trang thai GIAI NGAN cua lenh dang mo (cot giai_ngan tu AFL): khi RS so voi
// VN-Index <= 0 van bao MUA nhung chi giai ngan 1 phan, cho phien sau bo sung.
// Tra null neu khong can hien gi (giai ngan du / khong giu lenh).
export function nhanGiaiNgan(row) {
  switch (row?.giai_ngan) {
    case "MOT PHAN":
      return {
        nhan: "Giải ngân 1 phần",
        mau: "#FBBF24",
        moTa: "Sức mạnh so với thị trường còn yếu nên chỉ giải ngân khoảng 1/3–1/2 tỷ trọng dự kiến. Chờ các phiên sau: khi sức mạnh so với VN-Index chuyển dương, lệnh đang có lãi và điểm vẫn trong vùng mua thì bổ sung nốt phần còn lại.",
      };
    case "BO SUNG":
      return { nhan: "Bổ sung", mau: "#22D3EE", moTa: "Đủ điều kiện giải ngân nốt phần còn lại của lệnh đã mua thăm dò." };
    case "GIU 1 PHAN":
      return { nhan: "Giữ 1 phần", mau: "#8B8B99", moTa: "Đã hết thời hạn chờ bổ sung — giữ nguyên tỷ trọng nhỏ, không mua thêm." };
    default:
      return null;
  }
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

// Muc TP CAO NHAT tung cham toi trong SUOT qua trinh giu (khong chi gia
// HIEN TAI) - uu tien doc thang cot tp_da_cham (AFL tinh bang HighestSince,
// nho ca nhung lan da cham roi tut xuong lai). Neu ma chua duoc Explore lai
// voi ban AFL moi (tp_da_cham con null/thieu) thi tam thoi fallback ve cach
// cu (so gia HIEN TAI voi TP) de khong mat trang tinh nang trong luc cho
// nguoi dung upload lai - se tu dong het fallback khi du lieu duoc cap nhat.
export function chamTPCaoNhat(row) {
  if (row.tp_da_cham) return row.tp_da_cham;
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
