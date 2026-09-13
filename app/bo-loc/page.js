import { layTatCaTinHieu } from "@/lib/tinHieu";
import BangBoLoc from "@/components/BangBoLoc";

export const dynamic = "force-dynamic";

export default async function TrangBoLoc() {
  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = String(e?.message || e);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: "#F5F5F7" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Bộ lọc cổ phiếu
      </h1>
      <p className="text-sm mb-6" style={{ color: "#8B8B99" }}>
        Lọc và sắp xếp toàn bộ {tatCa.length} cổ phiếu HOSE đang theo dõi theo nhiều tiêu chí.
      </p>

      {loi ? (
        <p className="text-sm" style={{ color: "#EF4444" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      ) : (
        <BangBoLoc duLieu={tatCa} />
      )}
    </div>
  );
}
