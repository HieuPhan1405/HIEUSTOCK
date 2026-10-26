import { Suspense } from "react";
import Link from "next/link";
import XuatAnh from "@/components/XuatAnh";
import TheThiTruong from "@/components/TheThiTruong";
import { capNhatMoiNhat } from "@/components/dungChung";
import DongTienThiTruong from "@/components/DongTienThiTruong";
import { layCoDem } from "@/lib/boNhoMem";
import { layTatCaTinHieu, layChiSoVNIndex } from "@/lib/tinHieu";
import { layDongTienNuocNgoai } from "@/lib/thiTruong";
import { TongQuanThiTruong } from "@/components/RaSoatThiTruong";
import ThanhKhoanThiTruong from "@/components/ThanhKhoanThiTruong";
import AnhHuongIndex from "@/components/AnhHuongIndex";
import KhoiNgoaiThiTruong from "@/components/KhoiNgoaiThiTruong";
import VungGiaTriChiSo from "@/components/VungGiaTriChiSo";
import { layLichSuGia } from "@/lib/lichSuGia";
import { viTriTheoVungGiaTri } from "@/lib/vungGiaTriChiSo";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dashboard thị trường",
  description: "Độ rộng thị trường, dòng tiền chủ động, thanh khoản, ảnh hưởng tới VN-Index, định giá PE/PB và các chỉ số tổng quan.",
};

const TEXT = "var(--chu)";
const MUTED = "var(--mo)";

// 2 the dung NGUON NGOAI (cham, 1-4 giay): KHONG chan ca trang. Tach thanh Suspense de phan chinh (DB, nhanh) hien ngay, 2 the nay hien sau khi co du lieu; them bo nho may chu
// (layCoDem: tra ngay ban cu, lam moi ngam) nen tu lan thu 2 gan nhu tuc thi. Truoc day trang cho nguon ngoai toi da 4 giay moi lan mo -> bam gi cung bi do.
function TheCho({ tieuDe }) {
  return (
    <div className="rounded-2xl border p-6 mb-6 text-sm" style={{ borderColor: "var(--vien)", background: "var(--card)", color: MUTED }} aria-busy="true">
      {tieuDe}: đang tải…
    </div>
  );
}
async function TheKhoiNgoai() {
  const ngoai = await layCoDem("khoi-ngoai", 300_000, layDongTienNuocNgoai, { choToiDaMs: 8000 });
  return <KhoiNgoaiThiTruong ngoai={ngoai} />;
}
async function TheVungGiaTri() {
  const vt = await layCoDem("vung-gia-tri-vnindex", 120_000, () => layLichSuGia("VNINDEX", 200).then((nen) => viTriTheoVungGiaTri(nen)), { choToiDaMs: 8000 });
  return <VungGiaTriChiSo vt={vt} />;
}

export default async function TrangDashboard() {
  let tatCa = [];
  let chiSoVNIndex = null;
  let loi = null;
  try {
    [tatCa, chiSoVNIndex] = await Promise.all([layTatCaTinHieu(), layChiSoVNIndex()]);
  } catch (e) {
    loi = thongBaoLoi(e);
  }

  const capNhat = capNhatMoiNhat(tatCa);
  const ngayHienThi = capNhat ? new Date(capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric", year: "numeric" }) : "";

  return (
    <div id="chup-dashboard" className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
          Dashboard thị trường
        </h1>
        {/* the chia se thi truong rieng (720px, chu to, doc duoc tren Zalo) thay cho chup nguyen trang rong ~1200px */}
        {tatCa.length > 0 && (
          <XuatAnh
            nhan="Chụp ảnh dashboard"
            kieu="nho"
            tenFile={`CloudStock-thi-truong-${new Date().toISOString().slice(0, 10)}.png`}
            tieuDe="Dashboard thị trường"
            the={<TheThiTruong tatCa={tatCa} vnindex={chiSoVNIndex} ngay={ngayHienThi} />}
          />
        )}
      </div>
      <p className="text-sm mb-5" style={{ color: MUTED }}>
        Tổng quan, độ rộng, dòng tiền, vùng giá trị và thanh khoản (phần ngành nằm ở trang Ngành) — tách riêng khỏi trang Tổng quan (trang đó chỉ tập trung vào hướng đi lệnh/vị thế).
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <TongQuanThiTruong tatCa={tatCa} vnindex={chiSoVNIndex} />
      <DongTienThiTruong />
      <Suspense fallback={<TheCho tieuDe="Vị trí VN-Index so với vùng giá trị" />}>
        <TheVungGiaTri />
      </Suspense>
      <Link href="/nganh" className="flex items-center justify-between gap-3 rounded-2xl border p-4 mb-6 text-sm hover:opacity-90" style={{ borderColor: "var(--vien)", background: "var(--card)", color: TEXT }}>
        <span>
          <b style={{ fontFamily: "var(--font-chu)" }}>Phân tích ngành</b> — RRG ngành đang dẫn dắt, xếp hạng RS và bản đồ nhiệt
        </span>
        <span style={{ color: "var(--tim-nhat)" }}>Xem →</span>
      </Link>
      <ThanhKhoanThiTruong ma="VNINDEX" />
      <AnhHuongIndex />
      <Suspense fallback={<TheCho tieuDe="Dòng tiền khối ngoại" />}>
        <TheKhoiNgoai />
      </Suspense>
    </div>
  );
}
