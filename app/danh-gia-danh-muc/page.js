import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import DanhGiaDanhMuc from "@/components/DanhGiaDanhMuc";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";
import { NGANH_NHAN } from "@/lib/nganh";
import { layRRGNganh } from "@/lib/phanTichCoBanDb";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Đánh giá danh mục cổ phiếu miễn phí",
  description:
    "Chấm điểm sức khỏe danh mục cổ phiếu như quỹ đầu tư: đa dạng hóa thật, rủi ro gánh của từng mã, beta, một phiên xấu, kiểm tra sức chịu đựng khi VN-Index giảm, margin và thanh khoản. Miễn phí, dữ liệu lưu trên máy bạn.",
};

// MO CHO MOI NGUOI (cong cu quang ba web): phan phan tich rui ro chi dung du lieu gia cong khai. Tin hieu he thong (MUA / BAN, cat lo, chot loi) CHI gui cho thanh vien da duoc duyet -
// khach chi nhan cac truong cong khai giong allowlist lib/lamSachChoKhach.js (gia, Kijun, duong can bang, nganh...).
export default async function TrangDanhGiaDanhMuc() {
  const nguoiDung = await layNguoiDungHienTai().catch(() => null);
  const laThanhVien = !!nguoiDung?.da_duyet;
  let tatCa = [];
  let loi = null;
  // RRG nganh la du lieu phu (khong co thi bo qua): goc Dan dat / Cai thien / Yeu dan / Tut hau tung nganh de nhan xet viec cam nhieu ma khi dang song nganh.
  let gocNganh = {};
  try {
    const [a, rrg] = await Promise.all([layTatCaTinHieu(), layRRGNganh().catch(() => null)]);
    tatCa = a;
    gocNganh = Object.fromEntries((rrg?.ketQua ?? []).map((k) => [NGANH_NHAN[k.nganh] || k.nganh, k.goc]));
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  const duLieu = Object.fromEntries(
    tatCa.map((r) => {
      const chung = { ma: r.ma, gia: r.gia, doi: r.doi, kijun: r.kijun, gg_bot: r.gg_bot, nganh: NGANH_NHAN[r.nganh] || r.nganh || "Khác", von_hoa: r.von_hoa };
      return [r.ma, laThanhVien ? { ...chung, tin: r.tin, diem: r.diem, stop_loss: r.stop_loss, tp1: r.tp1, ban_bot: !!r.ban_bot } : chung];
    })
  );
  const luc = capNhatMoiNhat(tatCa);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: "var(--font-chu)", fontWeight: 800 }}>
        Đánh giá danh mục
      </h1>
      <p className="text-sm mb-4 max-w-3xl" style={{ color: "var(--mo)" }}>
        Nhập các mã bạn đang cầm — web chấm điểm sức khỏe danh mục theo cách các quỹ đầu tư làm: danh mục <b>thật sự</b> đa dạng đến đâu, mã nào đang gánh phần lớn rủi ro, một phiên xấu mất bao nhiêu, VN-Index giảm 10–20% thì
        tài sản và tỷ lệ ký quỹ ra sao, và cần bao lâu để bán hết. Miễn phí, dữ liệu danh mục chỉ lưu trên máy bạn.
      </p>
      <NhanCapNhat luc={luc} className="mb-4" />
      {loi ? (
        <p className="text-sm" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      ) : (
        <DanhGiaDanhMuc duLieu={duLieu} gocNganh={gocNganh} laThanhVien={laThanhVien} ngay={luc ? new Date(luc).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : ""} />
      )}
    </div>
  );
}
