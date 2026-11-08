import { Suspense } from "react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import BanDoNhiet from "@/components/BanDoNhiet";
import BangRSNganh from "@/components/BangRSNganh";
import RRGNganh from "@/components/RRGNganh";
import RRGNganhCoChuDe from "@/components/RRGNganhCoChuDe";
import BangNhietMuaVu from "@/components/BangNhietMuaVu";
import { tinhRSNganh } from "@/lib/rsNganh";
import { layRRGNganh } from "@/lib/phanTichCoBanDb";
import { capNhatMoiNhat } from "@/components/dungChung";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Phân tích ngành",
  description: "RRG ngành (ngành nào đang dẫn dắt), sức mạnh tương đối RS theo ngành, bản đồ nhiệt, dòng tiền và bảng nhiệt mùa vụ (lợi suất theo tháng) của từng ngành.",
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
      {rrg && (
        <Suspense fallback={<RRGNganh du={{ rrg }} />}>
          <RRGNganhCoChuDe rrg={rrg} />
        </Suspense>
      )}
      <BangRSNganh hang={tinhRSNganh(tatCa)} />
      {/* Ban do nhiet chi can ~8 truong (ma, nganh, % ngay, RS20/RS60, diem, GTGD, von hoa - deu la truong khach cung duoc thay). KHONG gui nguyen dong tin hieu xuong trinh duyet: truoc 09/11/2026 trang nay lo gia mua / cat lo / TP / tin hieu cua moi ma cho ca khach
          (trai voi lib/lamSachChoKhach.js) va nang them ~1 MB. */}
      <BanDoNhiet tatCa={tatCa.map((r) => ({ ma: r.ma, nganh: r.nganh, doi: r.doi, gtgd_tb20: r.gtgd_tb20, rs_vni: r.rs_vni, rs_vni_60: r.rs_vni_60, diem: r.diem, von_hoa_ty: r.von_hoa_ty }))} />
      {/* Bang nhiet MUA VU (loi suat thang x nam, VN-Index + 22 nganh) - du lieu tinh lib/muaVuDuLieu.js, cap nhat bang scripts/capNhatMuaVu.mjs */}
      <div className="mt-6">
        <BangNhietMuaVu />
      </div>
    </div>
  );
}
