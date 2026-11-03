import PhuongPhapDaiHan from "@/components/PhuongPhapDaiHan";
import NhanCapNhat from "@/components/NhanCapNhat";
import LienKetPhongCach from "@/components/LienKetPhongCach";
import { layDuLieuDaiHan } from "@/lib/phuongPhapDaiHanDb";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Đầu tư dài hạn",
  description:
    "Bộ phương pháp đầu tư dài hạn đã kiểm tra trên dữ liệu thị trường Việt Nam: Buffett, Cổ tức, Graham, ít biến động; mô hình lõi & vệ tinh; định giá, vùng giá giải ngân chia 5 đợt và cách bán đúng. Miễn phí.",
};

// MO CHO MOI NGUOI: chi dung du lieu cong khai (gia, BCTC, duong ky thuat) - khong dung tin hieu MUA / BAN cua he thong. Danh sach ma theo BCTC sinh bang scripts/capNhatPhuongPhapDaiHan.mjs.
export default async function TrangDaiHan() {
  let du = null;
  let loi = null;
  try {
    du = await layDuLieuDaiHan();
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: "var(--font-chu)", fontWeight: 800 }}>
        Đầu tư dài hạn
      </h1>
      <p className="text-sm mb-4 max-w-3xl" style={{ color: "var(--mo)" }}>
        Chọn doanh nghiệp tốt theo tiêu chí của các nhà đầu tư nổi tiếng, mua chia 5 đợt theo vùng giá và biết khi nào nên bán. Không dùng tín hiệu mua bán ngắn hạn.
      </p>
      <LienKetPhongCach loai="daiHan" className="mb-4 -mt-2" />
      {du?.capNhat && <NhanCapNhat luc={du.capNhat} className="mb-4" />}
      {loi ? (
        <p className="text-sm" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      ) : (
        <PhuongPhapDaiHan du={du} />
      )}
    </div>
  );
}
