import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import DanhGiaDanhMuc from "@/components/DanhGiaDanhMuc";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";
import { NGANH_NHAN } from "@/lib/nganh";
import { layRRGNganh } from "@/lib/phanTichCoBanDb";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { layKichBanMua } from "@/lib/kichBanMuaDb";
import { layDuLieuDaiHan } from "@/lib/phuongPhapDaiHanDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Đánh giá danh mục cổ phiếu miễn phí",
  description:
    "Chấm điểm danh mục cổ phiếu như quỹ đầu tư theo phong cách của bạn (xu hướng hoặc dài hạn): đa dạng hóa thật, rủi ro gánh từng mã, sức khỏe doanh nghiệp, kiểm tra sức chịu đựng, margin; gợi ý cắt lỗ / trung bình giá, nhật ký giao dịch và báo cáo PDF. Miễn phí.",
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
  // Thanh vien: them DIEM MUA cua he thong cho trung binh gia co dieu kien - diem B mua phuc hoi (chi_bao_ky_thuat pb_*) va vung mua (kich_ban_mua mua_tu..mua_den). Loi thi bo qua.
  let pbTheoMa = new Map();
  let vungMuaTheoMa = new Map();
  let daiHan = null;
  try {
    const [a, rrg, cbk, kb, dh] = await Promise.all([
      layTatCaTinHieu(),
      layRRGNganh().catch(() => null),
      laThanhVien ? layChiBaoKyThuat().catch(() => null) : null,
      laThanhVien ? layKichBanMua().catch(() => null) : null,
      layDuLieuDaiHan().catch(() => null), // danh sach doanh nghiep dai han (cong khai) cho tab Goi y mua cua phong cach Dai han
    ]);
    tatCa = a;
    // chi giu truong can cho goi y (gia da tinh lai theo gia moi nhat); mo cho khach vi cung la du lieu cong khai cua trang /dai-han
    daiHan = dh?.phuongPhap ? Object.fromEntries(Object.entries(dh.phuongPhap).map(([k, p]) => [k, { ds: p.ds.map((m) => ({ ma: m.ma, nganh: m.nganhNhan ?? m.nganh, gia: m.gia, giaHopLy: m.giaHopLy, sma50: m.sma50, sma200: m.sma200, ggTop: m.ggTop })) }])) : null;
    gocNganh = Object.fromEntries((rrg?.ketQua ?? []).map((k) => [NGANH_NHAN[k.nganh] || k.nganh, k.goc]));
    pbTheoMa = new Map((cbk?.hang ?? []).filter((h) => h.pb_cach != null && h.pb_cach <= 2).map((h) => [h.ma, { pb_cach: h.pb_cach, pb_gia: h.pb_gia, pb_sl: h.pb_sl, pb_giam: h.pb_giam }]));
    vungMuaTheoMa = new Map((kb?.hang ?? []).filter((h) => h.mua_tu > 0).map((h) => [h.ma, { mua_tu: h.mua_tu, mua_den: h.mua_den }]));
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  const duLieu = Object.fromEntries(
    tatCa.map((r) => {
      const chung = { ma: r.ma, gia: r.gia, doi: r.doi, kijun: r.kijun, gg_bot: r.gg_bot, nganh: NGANH_NHAN[r.nganh] || r.nganh || "Khác", von_hoa: r.von_hoa };
      return [r.ma, laThanhVien ? { ...chung, tin: r.tin, diem: r.diem, stop_loss: r.stop_loss, tp1: r.tp1, ban_bot: !!r.ban_bot, ...pbTheoMa.get(r.ma), ...vungMuaTheoMa.get(r.ma) } : chung];
    })
  );
  const luc = capNhatMoiNhat(tatCa);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: "var(--font-chu)", fontWeight: 800 }}>
        Đánh giá danh mục
      </h1>
      <p className="text-sm mb-4 max-w-3xl" style={{ color: "var(--mo)" }}>
        Nhập các mã bạn đang cầm và chọn phong cách đầu tư. Web chấm điểm danh mục như các quỹ: đa dạng thật đến đâu, mã nào gánh rủi ro, thị trường giảm thì mất bao nhiêu — rồi gợi ý giữ, cắt lỗ hay trung bình giá
        từng mã, kèm báo cáo PDF. Miễn phí.
      </p>
      <NhanCapNhat luc={luc} className="mb-4" />
      {loi ? (
        <p className="text-sm" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      ) : (
        <DanhGiaDanhMuc duLieu={duLieu} daiHan={daiHan} gocNganh={gocNganh} laThanhVien={laThanhVien} dangNhap={!!nguoiDung} ngay={luc ? new Date(luc).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : ""} />
      )}
    </div>
  );
}
