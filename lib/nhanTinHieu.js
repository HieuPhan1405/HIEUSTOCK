// NHAN THONG TIN CHO TIN HIEU MUA (chi de THAM KHAO, khong chan lenh, khong anh huong tin hieu MUA/BAN) - ham THUAN, import tuong doi de test tay: engine/test/nhanTinHieu.test.mjs.
// Hai nhan (nghien cuu 27/10/2026 tren ~4.400 lenh Mua thuong, kiem tra ngoai mau tach moc 1/5/2022, co tinh lenh dang mo; Hieu chot: nguoi dung tu chon lenh):
//  - NHAN TONG "Thi truong 5 phien gan day" (d5): VN-Index 5 phien den hom nay. Tin hieu MUA luc d5 tang ro cho ket qua tot hon (chenh trung binh ~+1,7 diem %/lenh); khong tac dung khi chi tinh d5 den hom truoc.
//  - NHAN RIENG "Vi tri gia trong bien do 120 phien" (pos = (dong cua - thap nhat 120) / (cao nhat 120 - thap nhat 120)): vung cao (>= 0,8) ket qua tot nhat ngoai mau; nua duoi (< 0,5) kem hon. Cac lenh lai lon nhat nam 2026 (MSR, PET, PVP, CDC...) KHONG nam o vung cao nen day chi la nhan tham khao.
// Nguong chi dat o day, KHONG hien so tren giao dien (luat noi dung: khong cong bo nguong). Mo ta luon kem "chi de tham khao, khong phai khuyen nghi".
export const NGUONG_D5_UNG_HO_PCT = 1; // VN-Index 5 phien > 1% -> "ung ho"
export const NGUONG_VI_TRI_CAO = 0.8; // pos >= 0,8 -> vung cao
export const NGUONG_VI_TRI_THAP = 0.5; // pos < 0,5 -> nua duoi

const so = (v) => (v == null || v === "" ? NaN : Number(v));

// nen: [{ t, c }] tang dan theo ngay (nen cuoi = hom nay, ke ca nen dang chay giua phien). Tra ve % VN-Index 5 phien (dong cua hien tai so voi dong cua 5 phien truoc) hoac null.
export function tinhD5(nen) {
  if (!Array.isArray(nen) || nen.length < 6) return null;
  const cuoi = so(nen[nen.length - 1]?.c);
  const truoc = so(nen[nen.length - 6]?.c);
  if (!(cuoi > 0) || !(truoc > 0)) return null;
  return (cuoi / truoc - 1) * 100;
}

// d5: % VN-Index 5 phien. Tra ve { khoa, ungHo, d5, nhan, moTa } hoac null neu chua co so lieu.
export function nhanThiTruong5Phien(d5) {
  const v = so(d5);
  if (!Number.isFinite(v)) return null;
  if (v > NGUONG_D5_UNG_HO_PCT) {
    return {
      khoa: "ung_ho",
      ungHo: true,
      d5: v,
      nhan: "Thị trường 5 phiên gần đây: ủng hộ lệnh mua",
      moTa: "VN-Index đang tăng khá rõ trong 5 phiên gần nhất. Theo thống kê lịch sử của hệ thống, tín hiệu MUA xuất hiện trong bối cảnh như vậy cho kết quả tốt hơn. Chỉ để tham khảo, không phải khuyến nghị.",
    };
  }
  return {
    khoa: "chua_ung_ho",
    ungHo: false,
    d5: v,
    nhan: "Thị trường 5 phiên gần đây: chưa ủng hộ lệnh mua",
    moTa: "VN-Index chưa tăng rõ trong 5 phiên gần nhất. Theo thống kê lịch sử, tín hiệu MUA trong bối cảnh này cho kết quả kém hơn, nhưng vẫn có những nhóm cổ phiếu mạnh riêng đi ngược thị trường chung. Chỉ để tham khảo, không phải khuyến nghị.",
  };
}

// row: dong tin hieu (co vi_tri_120 trong 0..1). Chi gan nhan cho tin hieu MUA moi (row.tin === "MUA"): voi mã NẮM GIỮ thì vi_tri_120 la vi tri HIEN TAI, khong phai vi tri luc vao lenh nen khong dung de danh gia lenh.
// Tra ve { khoa, nhan, mau, moTa } hoac null (vung giua khong gan nhan).
export function nhanViTri120(row) {
  if (!row || row.tin !== "MUA") return null;
  const v = so(row.vi_tri_120);
  if (!Number.isFinite(v)) return null;
  if (v >= NGUONG_VI_TRI_CAO) {
    return {
      khoa: "vung_cao",
      nhan: "Giá ở vùng cao biên độ 6 tháng",
      mau: "var(--xanh)",
      moTa: "Giá đóng cửa đang ở vùng cao trong biên độ khoảng 6 tháng gần đây (gần đỉnh hơn đáy). Theo thống kê lịch sử, lệnh mua ở vị trí này có kết quả tốt hơn trung bình, nhưng số lệnh ít và không đảm bảo; nhiều lệnh lãi lớn lại xuất hiện ở vị trí thấp hơn. Chỉ để tham khảo, không phải khuyến nghị.",
    };
  }
  if (v < NGUONG_VI_TRI_THAP) {
    return {
      khoa: "nua_duoi",
      nhan: "Giá ở nửa dưới biên độ 6 tháng",
      mau: "var(--mo)",
      moTa: "Giá đóng cửa đang ở nửa dưới của biên độ khoảng 6 tháng gần đây (gần đáy hơn đỉnh). Theo thống kê lịch sử, lệnh mua ở vị trí này có kết quả kém hơn trung bình, nhưng vẫn có những lệnh đảo chiều tăng rất mạnh từ vùng thấp. Chỉ để tham khảo, không phải khuyến nghị.",
    };
  }
  return null;
}
