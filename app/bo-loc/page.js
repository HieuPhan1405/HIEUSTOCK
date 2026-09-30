import { Suspense } from "react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { COT_CHI_BAO } from "@/lib/cotChiBaoKyThuat";
import BangBoLoc from "@/components/BangBoLoc";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bộ lọc cổ phiếu",
  description: "Lọc và sắp xếp toàn bộ cổ phiếu HOSE, HNX, UPCOM theo tín hiệu, xu hướng, dòng tiền, thanh khoản và vốn hoá.",
};

export default async function TrangBoLoc() {
  let tatCa = [];
  let loi = null;
  let chiBaoLuc = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  // Chi bao ky thuat (RSI, MACD, MA...) gop vao tung ma - loi o day khong duoc lam mat bang chinh, chi mat bo loc chi bao.
  if (!loi) {
    try {
      const { hang, capNhatLuc } = await layChiBaoKyThuat();
      const theoMa = new Map(hang.map((h) => [h.ma, h]));
      tatCa = tatCa.map((r) => {
        const h = theoMa.get(r.ma);
        return h ? { ...r, ...Object.fromEntries(COT_CHI_BAO.map((k) => [k, h[k]])) } : r;
      });
      chiBaoLuc = capNhatLuc;
    } catch {}
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
          <BangBoLoc duLieu={tatCa} chiBaoLuc={chiBaoLuc} />
        </Suspense>
      )}
    </div>
  );
}
