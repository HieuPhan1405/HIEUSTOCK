// KHOA TIN HIEU O TRANG CHINH (2026-10-13) - ham THUAN, import tuong doi de test tay: engine/test/khoaTrangChu.test.mjs.
// Khach chua dang nhap (hoac da dang nhap nhung chua duoc duyet) KHONG thay tin hieu MUA/BAN, Mat Than, chot loi, ban bot, danh sach "Top co hoi" o trang Tong quan - cung quy tac voi /api/signals va /bo-loc.
// nguoiDung: ket qua layNguoiDungHienTai() (null neu chua dang nhap; co da_duyet).
export function quyenTrangChu(nguoiDung) {
  const xemTinHieu = !!nguoiDung?.da_duyet;
  return { xemTinHieu, choDuyet: !!nguoiDung && !xemTinHieu };
}

// Cac cau trong "Nhan dinh nhanh" noi ve tin hieu (Mat Than, MUA/BAN hom nay) - khach khong duoc thay. cac: mang cau [{ cau, tinHieu }].
export function locCauNhanDinh(cac, xemTinHieu) {
  return cac.filter((c) => xemTinHieu || !c.tinHieu).map((c) => c.cau);
}
