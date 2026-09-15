import { layTatCaBatDay } from "@/lib/batDay";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import BangBatDay from "@/components/BangBatDay";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import { pct } from "@/components/dungChung";

export const dynamic = "force-dynamic";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";

function TheKPI({ nhan, giaTri, phu, mau }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mau || TEXT }}>
        {giaTri}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {nhan}
      </p>
      {phu && (
        <p className="text-[11px]" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

export default async function TrangBatDay() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Checklist dò bắt đáy"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem toàn bộ lịch sử checklist bắt đáy và tỷ lệ thành công thực tế."
      />
    );
  }

  let duLieu = [];
  let loi = null;
  try {
    duLieu = await layTatCaBatDay();
  } catch (e) {
    loi = String(e?.message || e);
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
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Checklist dò bắt đáy
      </h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Toàn bộ lịch sử các lần checklist bắt đáy kích hoạt (chiết khấu sâu + quá bán + capitulation/phân kỳ + follow-through day)
        trên nhóm VN100, kèm kết quả thực tế sau 5/10/20 phiên để tự đánh giá độ tin cậy.
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <TheKPI nhan="Tổng số lần bắt đáy" giaTri={duLieu.length} />
        <TheKPI
          nhan="Tỷ lệ thành công"
          giaTri={`${tyLeThanhCong.toFixed(0)}%`}
          phu={`${soThanhCong}/${daXongTheoDoi.length} lần đã có kết quả`}
          mau={XANH}
        />
        <TheKPI nhan="Lãi/lỗ trung bình (sau 20 phiên)" giaTri={pct(laiTrungBinh, 2)} mau={laiTrungBinh >= 0 ? XANH : DO} />
        <TheKPI nhan="Lãi trung bình khi thành công" giaTri={pct(laiTrungBinhKhiThanhCong, 2)} mau={XANH} />
      </div>

      {!loi && duLieu.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
          Chưa có dữ liệu — cần chạy Explore với công thức 8_Export_ChecklistBatDay.afl (Apply to = All Symbols) rồi upload.
        </div>
      ) : (
        <BangBatDay duLieu={duLieu} />
      )}

      <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        "Đang theo dõi" = tín hiệu quá mới, chưa đủ 20 phiên để đánh giá kết quả. Không phải khuyến nghị đầu tư — chỉ là công cụ tham khảo lịch sử.
      </p>
    </div>
  );
}
