import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import TrangCaNhan from "@/components/TrangCaNhan";
import { taoMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = taoMeta({
  tieuDe: "Trang cá nhân",
  moTa: "Thông tin tài khoản, đổi mật khẩu và chọn loại thông báo cần nhận.",
  duongDan: "/tai-khoan",
  khongLapChiMuc: true,
});

// TRANG CA NHAN: bam vao ten tai khoan o thanh dau de vao. Xem thong tin, doi ten, doi mat khau, chon loai thong bao ve may (tich loai nao gui loai do). Can dang nhap.
export default async function TrangTaiKhoan() {
  let nd = null;
  try {
    nd = await layNguoiDungHienTai();
  } catch {
    nd = null;
  }
  if (!nd) {
    return <KhoaTrangNoiDung tieuDe="Trang cá nhân" moTa="Đăng ký hoặc đăng nhập để xem thông tin tài khoản, đổi mật khẩu và chọn loại thông báo cần nhận." />;
  }
  return <TrangCaNhan />;
}
