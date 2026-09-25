import { Suspense } from "react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import BangBoLoc from "@/components/BangBoLoc";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bộ lọc cổ phiếu",
  description: "Lọc và sắp xếp toàn bộ cổ phiếu HOSE, HNX, UPCOM theo tín hiệu, xu hướng, dòng tiền, thanh khoản và vốn hoá.",
};

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
      <p className="text-sm mb-4" style={{ color: "#8B8B99" }}>
        Lọc và sắp xếp toàn bộ {tatCa.length} cổ phiếu đang theo dõi (HOSE, HNX, UPCOM) theo nhiều tiêu chí.
      </p>
      <NhanCapNhat luc={capNhatMoiNhat(tatCa)} className="mb-6" />

      {loi ? (
        <p className="text-sm" style={{ color: "#EF4444" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      ) : (
        <Suspense fallback={null}>
          <BangBoLoc duLieu={tatCa} />
        </Suspense>
      )}
    </div>
  );
}
