import { layTatCaBatDay } from "@/lib/batDay";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import BangBatDay from "@/components/BangBatDay";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import HuongDanDungHieuQua from "@/components/HuongDanDungHieuQua";
import { pct } from "@/components/dungChung";
import { thongBaoLoi } from "@/lib/loiAnToan";
import GiaiThichThem from "@/components/GiaiThichThem";
import DaiThongKe, { OThongKe } from "@/components/DaiThongKe";
import { NhanMuc } from "@/components/LienKetPhongCach";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Checklist bắt đáy",
  description: "Danh sách kiểm tra điều kiện bắt đáy cho từng cổ phiếu.",
};

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";

export default async function TrangBatDay() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Checklist dò bắt đáy"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem toàn bộ lịch sử checklist bắt đáy và tỷ lệ thành công thực tế."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let duLieu = [];
  let loi = null;
  try {
    duLieu = await layTatCaBatDay();
  } catch (e) {
    loi = thongBaoLoi(e);
  }

  // Chi tinh ty le thanh cong tren cac lan DA CO DU DU LIEU 20 phien sau -
  // cac lan qua moi (chua du 20 phien) khong tinh vao mau, tranh sai lech.
  const daXongTheoDoi = duLieu.filter((r) => r.pct_sau_20 != null);
  const soThanhCong = daXongTheoDoi.filter((r) => r.pct_sau_20 > 0).length;
  const tyLeThanhCong = daXongTheoDoi.length ? (soThanhCong / daXongTheoDoi.length) * 100 : 0;
  const laiTrungBinh = daXongTheoDoi.length
    ? daXongTheoDoi.reduce((tong, r) => tong + r.pct_sau_20, 0) / daXongTheoDoi.length
    : 0;
  const laiTrungBinhKhiThanhCong = soThanhCong
    ? daXongTheoDoi.filter((r) => r.pct_sau_20 > 0).reduce((tong, r) => tong + r.pct_sau_20, 0) / soThanhCong
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: TEXT }}>
      <NhanMuc chu="Bắt đáy" />
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Checklist dò bắt đáy
      </h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        Các lần cổ phiếu đủ điều kiện bắt đáy (giảm sâu, quá bán, bán tháo rồi có phiên xác nhận), kèm kết quả thật sau 5/10/20 phiên để bạn tự đánh giá độ tin cậy.
      </p>
      <GiaiThichThem nhanMo="Điều kiện checklist" className="mb-4">
        Chiết khấu sâu + quá bán + capitulation/phân kỳ + follow-through day, trên toàn bộ cổ phiếu có GTGD ≥ 3 tỷ (VN100 và các mã khác, mã ngoài VN100 có nhãn &quot;khác&quot;).
      </GiaiThichThem>

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <DaiThongKe>
        <OThongKe nhan="Tỷ lệ thành công (sau 20 phiên)" so={`${tyLeThanhCong.toFixed(0)}%`} phu={`${soThanhCong}/${daXongTheoDoi.length} lần đã có kết quả`} mau={XANH} />
        <OThongKe nhan="Lãi/lỗ trung bình sau 20 phiên" so={pct(laiTrungBinh, 2)} mau={laiTrungBinh >= 0 ? XANH : DO} />
        <OThongKe nhan="Lãi trung bình khi thành công" so={pct(laiTrungBinhKhiThanhCong, 2)} mau={XANH} />
        <OThongKe nhan="Tổng số lần bắt đáy" so={duLieu.length} />
      </DaiThongKe>
      <HuongDanDungHieuQua moSan={false} />

      {!loi && duLieu.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
          Chưa có dữ liệu — cần chạy Explore với công thức 8_Export_ChecklistBatDay.afl (Apply to = All Symbols) rồi upload.
        </div>
      ) : (
        <BangBatDay duLieu={duLieu} />
      )}

      <GiaiThichThem className="mt-3" tomTat="Chỉ là công cụ tham khảo, không phải khuyến nghị đầu tư.">
        &quot;Đang theo dõi&quot; = tín hiệu quá mới, chưa đủ 20 phiên để đánh giá kết quả. Mã ngoài VN100 và nhóm &quot;KL đáy&quot; kiểm tra lịch sử cho kết quả không ổn định theo từng năm.
      </GiaiThichThem>
    </div>
  );
}
