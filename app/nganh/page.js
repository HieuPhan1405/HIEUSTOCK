import { Suspense } from "react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import NhomChuDeNganh from "@/components/NhomChuDeNganh";
import BanDoNhiet from "@/components/BanDoNhiet";
import BangRSNganh from "@/components/BangRSNganh";
import RRGNganh from "@/components/RRGNganh";
import RRGNganhCoChuDe from "@/components/RRGNganhCoChuDe";
import { tinhRSNganh } from "@/lib/rsNganh";
import { layRRGNganh } from "@/lib/phanTichCoBanDb";
import { capNhatMoiNhat } from "@/components/dungChung";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Phân tích ngành",
  description: "RRG ngành (ngành nào đang dẫn dắt), sức mạnh tương đối RS theo ngành, bản đồ nhiệt và dòng tiền theo ngành.",
};

const MUTED = "var(--mo)";

export default async function TrangNganh() {
  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  // RRG la du lieu bo sung (engine day len sau moi phien): loi / chua co thi bo qua
  const rrg = await layRRGNganh().catch(() => null);
  const capNhat = capNhatMoiNhat(tatCa);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Phân tích ngành
      </h1>
      <p className="text-sm mb-5" style={{ color: MUTED }}>
        Ngành nào đang dẫn dắt và có dòng tiền: RRG xoay vòng ngành, xếp hạng sức mạnh tương đối (RS) và bản đồ nhiệt.{capNhat ? ` Tín hiệu cập nhật ${capNhat}.` : ""}
      </p>
      {loi && (
        <p className="text-sm mb-6" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}
      <Suspense fallback={<p className="text-sm mb-8" style={{ color: MUTED }}>Đang tải nhóm chủ đề…</p>}>
        <NhomChuDeNganh />
      </Suspense>
      {rrg && (
        <Suspense fallback={<RRGNganh du={{ rrg }} />}>
          <RRGNganhCoChuDe rrg={rrg} />
        </Suspense>
      )}
      <BangRSNganh hang={tinhRSNganh(tatCa)} />
      <BanDoNhiet tatCa={tatCa} />
    </div>
  );
}
