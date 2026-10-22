import { layLichSuDiemB } from "@/lib/diemB";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import BangDiemB from "@/components/BangDiemB";
import HuongDanDungHieuQua from "@/components/HuongDanDungHieuQua";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Điểm mua phục hồi",
  description: "Lịch sử điểm mua phục hồi (điểm B) từ đầu 2026, bộ lọc nhanh và hướng dẫn dùng hiệu quả.",
};

const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const DO = "var(--do)";
const sans = { fontFamily: "'Inter', sans-serif" };

export default async function TrangMuaPhucHoi() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Điểm mua phục hồi"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem lịch sử điểm mua phục hồi và hướng dẫn dùng hiệu quả."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let duLieu = [];
  let loi = null;
  try {
    duLieu = await layLichSuDiemB();
  } catch (e) {
    loi = thongBaoLoi(e);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ ...sans, fontWeight: 700 }}>Điểm mua phục hồi (điểm B)</h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Cổ phiếu đã giảm sâu rồi đóng cửa lấy lại cả Tenkan và Kijun — xác nhận nhịp hồi đã bắt đầu, thường sớm hơn điểm MUA của hệ thống. Toàn bộ điểm B từ đầu 2026 trên các mã có GTGD ≥ 3 tỷ thuộc 11 ngành trọng tâm (ngân hàng, BĐS, chứng khoán, thép, thực phẩm, bán lẻ, công nghệ, logistics, dầu khí, hóa chất, xây dựng), kèm kết quả thực tế sau khi vào lệnh (mở cửa phiên kế tiếp).
      </p>

      <HuongDanDungHieuQua moSan />

      {loi && <p className="text-sm mb-6" style={{ color: DO }}>Lỗi tải dữ liệu: {loi}</p>}
      {!loi && duLieu.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: "var(--vien)", background: "var(--card)", color: MUTED }}>
          Chưa có dữ liệu — engine sẽ đẩy lịch sử điểm B lên sau lần chạy kế tiếp (mỗi 15 phút trong phiên).
        </div>
      ) : (
        <BangDiemB duLieu={duLieu} />
      )}

      <p className="text-[11px] mt-3" style={{ color: MUTED, ...sans }}>
        Lãi hiện tại = giá hiện tại so với giá vào (mở cửa phiên kế tiếp sau điểm B), chưa trừ phí; &quot;+5 phiên&quot; là lãi/lỗ sau 5 phiên kể từ khi vào. Các điểm B có ngày khác nhau nên thời gian nắm giữ khác nhau. &quot;Đang lãi&quot; = lãi hiện tại &gt; 0. Cột &quot;Thị trường&quot;: yếu = VN-Index thấp hơn đỉnh 60 phiên từ 7%. Nhãn &quot;đã có lệnh MUA&quot; chỉ dựa trên lệnh đã ghi nhận trên web. Không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
