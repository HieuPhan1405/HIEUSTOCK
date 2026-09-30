import { layLenhDaDong, ngayGiaoDichVN } from "@/lib/lenhDaDong";
import { layXuatHien } from "@/lib/xuatHienDb";
import ChatLuongTinHieu from "@/components/ChatLuongTinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import LenhDaDongView from "@/components/LenhDaDongView";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lệnh đã đóng",
  description: "Kết quả các lệnh mua-bán đã đóng: tỷ lệ thắng, lãi/lỗ trung bình, thời gian nắm giữ.",
};

export default async function TrangLenhDaDong() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Lệnh đã đóng"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem kết quả các lệnh mua-bán đã đóng: tỷ lệ thắng, lãi/lỗ trung bình, thời gian nắm giữ."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let ds = [];
  let loi = null;
  try {
    ds = await layLenhDaDong();
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  // Nhat ky tin hieu xuat hien tai rieng: loi o day khong lam hong phan Lenh da dong.
  let xuatHien = [];
  let loiXuatHien = null;
  try {
    xuatHien = await layXuatHien();
  } catch (e) {
    loiXuatHien = thongBaoLoi(e);
  }
  return (
    <>
      <LenhDaDongView ds={ds} loi={loi} />
      <div className="max-w-6xl mx-auto px-6 pb-12" style={{ color: "#F5F5F7" }}>
        <ChatLuongTinHieu rows={xuatHien} ngayHomNay={ngayGiaoDichVN()} loi={loiXuatHien} />
      </div>
    </>
  );
}
