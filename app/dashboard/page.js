import { layTatCaTinHieu } from "@/lib/tinHieu";
import BanDoNhiet from "@/components/BanDoNhiet";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dashboard thị trường",
  description: "Bản đồ nhiệt cổ phiếu theo ngành và các chỉ số tổng quan thị trường.",
};

const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";

export default async function TrangDashboard() {
  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = String(e?.message || e);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Dashboard thị trường
      </h1>
      <p className="text-sm mb-5" style={{ color: MUTED }}>
        Bản đồ nhiệt theo ngành và các chỉ số tổng quan — tách riêng khỏi trang Tổng quan để không quá tải. Sẽ bổ sung thêm chỉ số tâm lý/rủi ro và khối ngoại.
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: "#EF4444" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <BanDoNhiet tatCa={tatCa} />
    </div>
  );
}
