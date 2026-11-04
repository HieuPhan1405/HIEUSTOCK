import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import PhaVoPhaiSinh from "@/components/PhaVoPhaiSinh";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Phái sinh VN30F1M · Phá vỡ biến động 0,3",
  description: "Mức mua, bán khống và cắt lỗ trong ngày của hợp đồng tương lai VN30F1M theo cách phá vỡ biến động 0,3, kèm kết quả 20 phiên gần nhất.",
  robots: { index: false, follow: false },
};

// Tin hieu pha vo trong ngay cho hop dong tuong lai VN30F1M. 05/11/2026: mo cho THANH VIEN DA DUYET voi cach PHA VO BIEN DONG 0,3 (co trong menu "Phai sinh");
// quan tri (la_admin) va may dev xem du ca khoang mo cua 15 phut. API /api/phai-sinh co cung quy tac.
export default async function TrangPhaiSinh() {
  let nd = null;
  try {
    nd = await layNguoiDungHienTai();
  } catch {
    nd = null;
  }
  const xemDay = process.env.NODE_ENV !== "production" || nd?.la_admin === true;
  if (!xemDay && !nd?.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Phái sinh VN30F1M"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem mức mua, bán khống và cắt lỗ trong ngày của hợp đồng tương lai VN30F1M theo cách phá vỡ biến động 0,3, kèm kết quả các phiên gần nhất."
        choDuyet={!!nd}
      />
    );
  }
  return <PhaVoPhaiSinh chiBienDong={!xemDay} />;
}
