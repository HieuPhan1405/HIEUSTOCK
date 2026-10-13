import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import PhaVoPhaiSinh from "@/components/PhaVoPhaiSinh";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Phá vỡ trong ngày · VN30F1M",
  robots: { index: false, follow: false },
};

// Cong cu CA NHAN cua quan tri (tin hieu pha vo trong ngay cho hop dong tuong lai VN30F1M) - khong phai noi dung cho khach, khong co trong menu.
// Chi tai khoan co la_admin moi xem duoc; may dev (khong phai production) duoc xem de kiem thu. API /api/phai-sinh co cung dieu kien.
export default async function TrangPhaiSinh() {
  let duocXem = process.env.NODE_ENV !== "production";
  if (!duocXem) {
    try {
      const nd = await layNguoiDungHienTai();
      duocXem = nd?.la_admin === true;
    } catch {
      duocXem = false;
    }
  }
  if (!duocXem) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center" style={{ color: "var(--mo)" }}>
        <p className="text-sm">Trang này chỉ dành cho tài khoản quản trị. Hãy đăng nhập bằng tài khoản quản trị rồi mở lại.</p>
      </div>
    );
  }
  return <PhaVoPhaiSinh />;
}
