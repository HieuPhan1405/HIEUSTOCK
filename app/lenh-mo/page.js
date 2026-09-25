import { TriangleAlert } from "lucide-react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import LenhMoNoiDung from "@/components/LenhMoNoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";
import { layLichSuGia } from "@/lib/lichSuGia";
import { layMuaThemCuaToi } from "@/lib/muaThem";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sổ lệnh đang mở",
  description: "Danh mục các mã đang MUA / NẮM GIỮ: vùng mua, cắt lỗ, chốt lời và lãi/lỗ hiện tại.",
};

const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const DO = "#EF4444";

export default async function TrangLenhMo() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Sổ lệnh đang mở"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem toàn bộ danh mục đang MUA/NẮM GIỮ, điểm chốt lời và cảnh báo rủi ro."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = String(e?.message || e);
  }

  // "Dang mo" = ma vua phat tin hieu MUA hoac dang giu vi the (NAM GIU).
  // Uu tien hien CANH BAO MAT THAN len dau (rui ro dao chieu, can chu y truoc).
  const dangMo = tatCa
    .filter((r) => r.tin === "MUA" || r.tin === "NAM GIU")
    .sort((a, b) => (b.mat_than ? 1 : 0) - (a.mat_than ? 1 : 0));
  const soCanhBao = dangMo.filter((r) => r.mat_than).length;

  // Lich su dong cua VNINDEX de so sanh hieu suat cac lenh dang mo voi thi truong cung ky (loi nguon gia khong duoc lam hong trang).
  let vnindex = null;
  try {
    const nen = await layLichSuGia("VNINDEX", 400);
    vnindex = { nen: nen.map((b) => ({ t: b.t, c: b.c })) };
  } catch {}

  // Lua chon "da mua dot dau chua" cua RIENG tai khoan nay cho cac diem mua moi (loi DB khong lam hong trang).
  let daChonMuaThem = {};
  try {
    daChonMuaThem = await layMuaThemCuaToi(nguoiDung.id);
  } catch {}

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Sổ lệnh đang mở
      </h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        {loi ? "—" : `${dangMo.length} mã đang MUA hoặc NẮM GIỮ / tổng ${tatCa.length} mã theo dõi.`}
      </p>
      {soCanhBao > 0 && (
        <p className="text-sm mb-6 flex items-center gap-1.5" style={{ color: DO }}>
          <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />
          {soCanhBao} mã đang cảnh báo Mắt Thần — nên xem lại ngay.
        </p>
      )}
      {soCanhBao === 0 && <div className="mb-6" />}

      <NhanCapNhat luc={capNhatMoiNhat(tatCa)} className="mb-6" />

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <LenhMoNoiDung dangMo={dangMo} vnindex={vnindex} daChonMuaThem={daChonMuaThem} />
      <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Ngày mua/Giá mua lấy đúng thời điểm phát tín hiệu MUA thật trên AmiBroker (không ước tính). Ngày bán/Giá bán luôn trống vì đây là các lệnh còn đang mở. Chốt lời báo mức TP cao nhất mà giá hiện tại đã chạm tới — không tự động bán, chỉ là gợi ý tham khảo. ⚠ Bán bớt xuất hiện khi điểm hôm nay đã tụt dưới ngưỡng bán nhưng chưa đủ điều kiện Bán hẳn — gợi ý giảm bớt vị thế sớm hơn, không đợi đến khi có tín hiệu Bán toàn bộ.
      </p>
    </div>
  );
}
