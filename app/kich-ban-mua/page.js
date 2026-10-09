import { layKichBanMua } from "@/lib/kichBanMuaDb";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import BangKichBanMua from "@/components/BangKichBanMua";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Kịch bản mua",
  description: "Mã chưa có lệnh sẽ ra tín hiệu MUA ở mức giá nào và sau bao nhiêu phiên, theo các kịch bản giá giữ nguyên, tăng đều, giảm đều.",
};

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const DO = "var(--do)";

export default async function TrangKichBanMua() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Kịch bản mua"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem mã nào có thể ra tín hiệu MUA ở mức giá nào và sau bao nhiêu phiên."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let hang = [];
  let capNhatLuc = null;
  let loi = null;
  try {
    ({ hang, capNhatLuc } = await layKichBanMua());
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  const chuoiLuc = capNhatLuc
    ? new Date(capNhatLuc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Kịch bản mua
      </h1>
      <p className="text-sm mb-2" style={{ color: MUTED }}>
        Mã chưa có lệnh: giá đóng cửa hôm nay ở khoảng nào thì ra tín hiệu MUA, và nếu giá giữ nguyên, tăng đều hoặc giảm đều thì sau bao nhiêu phiên mã đủ điều kiện MUA. Mã đang giữ lệnh: khi nào có thể xuất hiện tín hiệu mua thêm giữa chừng.
      </p>
      {chuoiLuc && (
        <p className="text-[11px] mb-6" style={{ color: MUTED }}>
          Cập nhật lúc <b>{chuoiLuc}</b> (tính lại định kỳ trong phiên, không phải thời gian thực)
        </p>
      )}

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      {!loi && hang.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
          Chưa có dữ liệu kịch bản. Dữ liệu sẽ xuất hiện sau lần tính kế tiếp của hệ thống.
        </div>
      ) : (
        !loi && <BangKichBanMua duLieu={hang} />
      )}
    </div>
  );
}
