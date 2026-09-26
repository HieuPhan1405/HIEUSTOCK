import { TriangleAlert } from "lucide-react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import LenhMoNoiDung from "@/components/LenhMoNoiDung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";
import { layLichSuGia } from "@/lib/lichSuGia";
import { lenhDangMo } from "@/lib/muaThemTinhToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sổ lệnh đang mở",
  description: "Danh mục các mã đang MUA / NẮM GIỮ: vùng mua, cắt lỗ, chốt lời và lãi/lỗ hiện tại.",
};

const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const DO = "#EF4444";

export default async function TrangLenhMo({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const tabDau = typeof sp.tab === "string" ? sp.tab : undefined; // vd /lenh-mo?tab=hieuQua
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

  // Lich su dong cua VNINDEX: (1) so sanh hieu suat cac lenh dang mo voi thi truong cung ky, (2) lich phien de dem so phien giu cua lenh mua moi (loi nguon gia khong duoc lam hong trang).
  let vnindex = null;
  try {
    const nen = await layLichSuGia("VNINDEX", 400);
    vnindex = { nen: nen.map((b) => ({ t: b.t, c: b.c })) };
  } catch {}

  // "Dang mo" = MOI LENH la 1 dong rieng (gia mua, Stop-loss, TP, lai/lo rieng): lenh dau cua ma dang MUA/NAM GIU + cac lenh MUA MOI (dot sau) dang giu - xem lenhDangMo; ma co nhieu
  // lenh thi danh so (1), (2). Cach 2 TP + giu den BAN: lenh cham TP1/TP2 van con phan giu nen van nam o day cho toi khi he thong bao BAN; TP3 chi la moc tham khao.
  const lenhMo = lenhDangMo(tatCa, vnindex?.nen.map((b) => b.t) ?? null);
  const soMa = new Set(lenhMo.map((r) => r.ma)).size;
  const soCanhBao = new Set(lenhMo.filter((r) => r.mat_than).map((r) => r.ma)).size;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Sổ lệnh đang mở
      </h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        {loi
          ? "—"
          : `${lenhMo.length} lệnh đang mở${soMa < lenhMo.length ? ` của ${soMa} mã (mã có nhiều lệnh được đánh số (1), (2)...)` : ""} / tổng ${tatCa.length} mã theo dõi.`}
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

      <LenhMoNoiDung lenhMo={lenhMo} vnindex={vnindex} tabDau={tabDau} />
      <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Ngày mua/Giá mua lấy đúng thời điểm phát tín hiệu MUA thật trên AmiBroker (không ước tính). Mỗi lệnh là một dòng riêng với giá mua, cắt lỗ, chốt lời và lãi/lỗ tính riêng; mã có nhiều lệnh được đánh số (1), (2)... theo ngày mua, lệnh có nhãn Mua mới là lệnh vào đợt sau. Ngày bán/Giá bán luôn trống vì đây là các lệnh còn đang mở. Chốt lời báo mức TP cao nhất mà giá hiện tại đã chạm tới (TP1 chốt 30%, TP2 chốt 30%, 40% còn lại giữ đến tín hiệu BÁN; TP3 chỉ là mốc tham khảo). Hệ thống không tự động bán, chỉ là gợi ý tham khảo. ⚠ Bán bớt xuất hiện khi điểm hôm nay đã tụt dưới ngưỡng bán nhưng chưa đủ điều kiện Bán hẳn — gợi ý giảm bớt vị thế sớm hơn, không đợi đến khi có tín hiệu Bán toàn bộ.
      </p>
    </div>
  );
}
