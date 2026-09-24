import { layTatCaTinHieu, layChiSoVNIndex } from "@/lib/tinHieu";
import { layDongTienNuocNgoai } from "@/lib/thiTruong";
import { TongQuanThiTruong } from "@/components/RaSoatThiTruong";
import BanDoNhiet from "@/components/BanDoNhiet";
import ThanhKhoanThiTruong from "@/components/ThanhKhoanThiTruong";
import KhoiNgoaiThiTruong from "@/components/KhoiNgoaiThiTruong";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dashboard thị trường",
  description: "Bản đồ nhiệt theo ngành, thanh khoản trong phiên và các chỉ số tổng quan thị trường.",
};

const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";

export default async function TrangDashboard() {
  let tatCa = [];
  let chiSoVNIndex = null;
  let loi = null;
  try {
    [tatCa, chiSoVNIndex] = await Promise.all([layTatCaTinHieu(), layChiSoVNIndex()]);
  } catch (e) {
    loi = String(e?.message || e);
  }

  // Khoi ngoai: nguon ben ngoai, cho toi da 4 giay de khong lam cham trang.
  const ngoai = await Promise.race([layDongTienNuocNgoai().catch(() => null), new Promise((r) => setTimeout(() => r(null), 4000))]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Dashboard thị trường
      </h1>
      <p className="text-sm mb-5" style={{ color: MUTED }}>
        Tổng quan, độ rộng, bản đồ nhiệt theo ngành và thanh khoản — tách riêng khỏi trang Tổng quan (trang đó chỉ tập trung vào hướng đi lệnh/vị thế).
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: "#EF4444" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <TongQuanThiTruong tatCa={tatCa} vnindex={chiSoVNIndex} />
      <BanDoNhiet tatCa={tatCa} />
      <ThanhKhoanThiTruong ma="VNINDEX" />
      <KhoiNgoaiThiTruong ngoai={ngoai} />
    </div>
  );
}
