import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import GiaoDienThuChikou from "@/components/GiaoDienThuChikou";

export const dynamic = "force-dynamic";
// Trang thu nghiem: khong hien trong menu, khong cho may tim kiem lap chi muc.
export const metadata = { title: "Thử nghiệm Chikou thoáng — CloudStock", robots: { index: false, follow: false } };

export default async function TrangThuNghiemChikou() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) {
    return <KhoaTrangNoiDung tieuDe="Thử nghiệm Chikou thoáng" moTa="Trang thử nghiệm dành cho thành viên. Đăng nhập để xem." />;
  }

  let thuong = [];
  let chikou = [];
  let loi = null;
  try {
    [thuong, chikou] = await Promise.all([layTatCaTinHieu("thuong"), layTatCaTinHieu("chikou")]);
  } catch (e) {
    loi = String(e?.message || e);
  }
  return <GiaoDienThuChikou thuong={thuong} chikou={chikou} loi={loi} />;
}
