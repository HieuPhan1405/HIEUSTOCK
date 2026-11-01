import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import DanhGiaDanhMuc from "@/components/DanhGiaDanhMuc";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";
import { NGANH_NHAN } from "@/lib/nganh";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Đánh giá danh mục",
  description: "Tự nhập các mã bạn đang nắm giữ (số lượng, giá vốn) để xem lãi/lỗ, tỷ trọng, mức tập trung theo mã - ngành và nhận xét dựa trên tín hiệu của hệ thống.",
};

export default async function TrangDanhGiaDanhMuc() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Đánh giá danh mục"
        moTa="Đăng ký hoặc đăng nhập miễn phí để tự nhập danh mục của bạn và xem đánh giá: lãi/lỗ, tỷ trọng, mức tập trung và cảnh báo theo tín hiệu hệ thống."
        choDuyet={!!nguoiDung}
      />
    );
  }
  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  // Chi gui xuong trinh duyet cac truong can cho danh gia (nhe hon nhieu so voi ca dong tin hieu).
  const duLieu = Object.fromEntries(
    tatCa.map((r) => [
      r.ma,
      { ma: r.ma, gia: r.gia, doi: r.doi, tin: r.tin, diem: r.diem, kijun: r.kijun, gg_bot: r.gg_bot, stop_loss: r.stop_loss, tp1: r.tp1, ban_bot: !!r.ban_bot, nganh: NGANH_NHAN[r.nganh] || r.nganh || "Khác", von_hoa: r.von_hoa },
    ])
  );
  const luc = capNhatMoiNhat(tatCa);
  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>Đánh giá danh mục</h1>
      <p className="text-sm mb-4" style={{ color: "var(--mo)" }}>
        Tự điền các mã bạn đang nắm giữ (số lượng, giá vốn): web tính lãi/lỗ, tỷ trọng, mức tập trung theo mã và ngành, rồi nhận xét dựa trên tín hiệu của hệ thống.
      </p>
      <NhanCapNhat luc={luc} className="mb-4" />
      {loi ? <p className="text-sm" style={{ color: "var(--do)" }}>Lỗi tải dữ liệu: {loi}</p> : <DanhGiaDanhMuc duLieu={duLieu} ngay={luc ? new Date(luc).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : ""} />}
    </div>
  );
}
