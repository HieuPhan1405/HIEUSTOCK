import { layLenhDaDong } from "@/lib/lenhDaDong";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import LenhDaDongView from "@/components/LenhDaDongView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lệnh đã đóng",
  description: "Kết quả các lệnh mua-bán đã đóng: tỷ lệ thắng, lãi/lỗ trung bình, thời gian nắm giữ.",
};

export default async function TrangLenhDaDong() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Lệnh đã đóng"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem kết quả các lệnh mua-bán đã đóng: tỷ lệ thắng, lãi/lỗ trung bình, thời gian nắm giữ."
      />
    );
  }

  let ds = [];
  let loi = null;
  try {
    ds = await layLenhDaDong();
  } catch (e) {
    loi = String(e?.message || e);
  }
  return <LenhDaDongView ds={ds} loi={loi} />;
}
