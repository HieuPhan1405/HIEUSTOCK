import { Suspense } from "react";
import Link from "next/link";
import XuatAnh from "@/components/XuatAnh";
import TheThiTruong from "@/components/TheThiTruong";
import { capNhatMoiNhat } from "@/components/dungChung";
import DongTienThiTruong from "@/components/DongTienThiTruong";
import { layCoDem } from "@/lib/boNhoMem";
import { layTatCaTinHieu, layChiSoVNIndex } from "@/lib/tinHieu";
import { layDongTienNuocNgoai, tinhTongQuanThiTruong } from "@/lib/thiTruong";
import { TongQuanThiTruong } from "@/components/RaSoatThiTruong";
import BieuDoTamLyLichSu from "@/components/BieuDoTamLyLichSu";
import ThanhKhoanThiTruong from "@/components/ThanhKhoanThiTruong";
import AnhHuongIndex from "@/components/AnhHuongIndex";
import KhoiNgoaiThiTruong from "@/components/KhoiNgoaiThiTruong";
import VungGiaTriChiSo from "@/components/VungGiaTriChiSo";
import { layLichSuGia } from "@/lib/lichSuGia";
import { viTriTheoVungGiaTri } from "@/lib/vungGiaTriChiSo";
import { thongBaoLoi } from "@/lib/loiAnToan";
import BanDoNhiet from "@/components/BanDoNhiet";
import ThanhMucTrang from "@/components/ThanhMucTrang";

// Muc luc dinh o dau trang (10/11/2026): trang dai ~5.000px, 9 khoi lien nhau - bam chip de nhay toi phan can xem.
const MUC_LUC = [
  { id: "tong-quan", nhan: "Tổng quan" },
  { id: "ban-do-nhiet", nhan: "Bản đồ nhiệt" },
  { id: "tam-ly", nhan: "Tâm lý" },
  { id: "dong-tien", nhan: "Dòng tiền" },
  { id: "vung-gia-tri", nhan: "Vùng giá trị" },
  { id: "thanh-khoan", nhan: "Thanh khoản" },
  { id: "anh-huong", nhan: "Ảnh hưởng chỉ số" },
  { id: "khoi-ngoai", nhan: "Khối ngoại" },
];

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
  const ngoai = await layCoDem("khoi-ngoai", 300_000, layDongTienNuocNgoai, { choToiDaMs: 4000 });
  return <KhoiNgoaiThiTruong ngoai={ngoai} />;
}
async function TheVungGiaTri() {
  const vt = await layCoDem("vung-gia-tri-vnindex", 120_000, () => layLichSuGia("VNINDEX", 200).then((nen) => viTriTheoVungGiaTri(nen)), { choToiDaMs: 4000 });
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

  // diem "truc tiep" cua bieu do lich su tam ly: cung cong thuc 3 ty le voi chuoi lich su (khong gom ty le % ma dat diem MUA nhu dong ho)
  let tamLyHienTai = null;
  if (capNhat && chiSoVNIndex?.gia && tatCa.length) {
    const tq = tinhTongQuanThiTruong(tatCa, chiSoVNIndex);
    const ba = [tq.doRong.tong ? (tq.doRong.tang / tq.doRong.tong) * 100 : null, tq.tren.kijun, tq.tren.canBang];
    if (ba.every((x) => x != null)) tamLyHienTai = { ngay: new Date(capNhat).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }), s: ba.reduce((a, b) => a + b, 0) / 3, v: chiSoVNIndex.gia };
  }

  return (
    <div id="chup-dashboard" className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: TEXT }}>
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
      <p className="text-sm mb-3" style={{ color: MUTED }}>
        Bức tranh chung của thị trường: độ rộng, tâm lý, dòng tiền, thanh khoản và khối ngoại. Phần ngành nằm ở tab Ngành.
      </p>
      <ThanhMucTrang muc={MUC_LUC} />

      {loi && (
        <p className="text-sm mb-6" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <section id="tong-quan" className="scroll-mt-28">
        <TongQuanThiTruong tatCa={tatCa} vnindex={chiSoVNIndex} />
      </section>
      {/* Ban do nhiet (doi tieu chi to mau / co o). Chi gui xuong trinh duyet cac truong khach cung duoc thay (khong gui nguyen dong tin hieu: lib/lamSachChoKhach.js). */}
      <section id="ban-do-nhiet" className="scroll-mt-28">
      {tatCa.length > 0 && <BanDoNhiet tieuDe="Bản đồ nhiệt thị trường" tatCa={tatCa.map((r) => ({ ma: r.ma, nganh: r.nganh, doi: r.doi, gtgd_tb20: r.gtgd_tb20, rs_vni: r.rs_vni, rs_vni_60: r.rs_vni_60, diem: r.diem, von_hoa_ty: r.von_hoa_ty }))} />}
      </section>
      <section id="tam-ly" className="scroll-mt-28">
        <BieuDoTamLyLichSu hienTai={tamLyHienTai} />
      </section>
      <section id="dong-tien" className="scroll-mt-28">
        <DongTienThiTruong />
      </section>
      <section id="vung-gia-tri" className="scroll-mt-28">
        <Suspense fallback={<TheCho tieuDe="Vị trí VN-Index so với vùng giá trị" />}>
          <TheVungGiaTri />
        </Suspense>
      </section>
      <Link href="/nganh" className="flex items-center justify-between gap-3 rounded-2xl border p-4 mb-6 text-sm hover:opacity-90" style={{ borderColor: "var(--vien)", background: "var(--card)", color: TEXT }}>
        <span>
          <b style={{ fontFamily: "var(--font-chu)" }}>Phân tích ngành</b> — RRG ngành đang dẫn dắt, xếp hạng RS và bản đồ nhiệt
        </span>
        <span style={{ color: "var(--tim-nhat)" }}>Xem →</span>
      </Link>
      <section id="thanh-khoan" className="scroll-mt-28">
        <ThanhKhoanThiTruong ma="VNINDEX" />
      </section>
      <section id="anh-huong" className="scroll-mt-28">
        <AnhHuongIndex />
      </section>
      <section id="khoi-ngoai" className="scroll-mt-28">
        <Suspense fallback={<TheCho tieuDe="Dòng tiền khối ngoại" />}>
          <TheKhoiNgoai />
        </Suspense>
      </section>
    </div>
  );
}
