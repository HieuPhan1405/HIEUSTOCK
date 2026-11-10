import { Suspense } from "react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import BanDoNhiet from "@/components/BanDoNhiet";
import BangRSNganh from "@/components/BangRSNganh";
import RRGNganh from "@/components/RRGNganh";
import RRGNganhCoChuDe from "@/components/RRGNganhCoChuDe";
import BangNhietMuaVu from "@/components/BangNhietMuaVu";
import NhanCapNhat from "@/components/NhanCapNhat";
import ThanhMucTrang from "@/components/ThanhMucTrang";
import { tinhRSNganh } from "@/lib/rsNganh";
import { layRRGNganh } from "@/lib/phanTichCoBanDb";
import { capNhatMoiNhat } from "@/components/dungChung";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { taoMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = taoMeta({
  tieuDe: "Phân tích ngành",
  moTa: "RRG ngành (ngành nào đang dẫn dắt), sức mạnh tương đối RS theo ngành, bản đồ nhiệt, dòng tiền và bảng nhiệt mùa vụ (lợi suất theo tháng) của từng ngành.",
  duongDan: "/nganh",
});

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
  // Muc luc dinh (10/11/2026): trang ~7.000px gom 4 khoi lon - bam chip de nhay toi phan can xem.
  const mucLuc = [
    ...(rrg ? [{ id: "rrg", nhan: "RRG ngành" }] : []),
    { id: "xep-hang-rs", nhan: "Xếp hạng RS" },
    { id: "ban-do-nhiet", nhan: "Bản đồ nhiệt" },
    { id: "mua-vu", nhan: "Mùa vụ theo tháng" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Phân tích ngành
      </h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        Ngành nào đang dẫn dắt và có dòng tiền: RRG xoay vòng ngành, xếp hạng sức mạnh tương đối (RS) và bản đồ nhiệt.
      </p>
      {/* Truoc 10/11/2026 in thang chuoi ISO ("cap nhat 2026-11-10T08:30:16.111Z") - doi sang nhan cap nhat chung cua web. */}
      <NhanCapNhat luc={capNhat} className="mb-3" />
      <ThanhMucTrang muc={mucLuc} />
      {loi && (
        <p className="text-sm mb-6" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}
      {rrg && (
        <section id="rrg" className="scroll-mt-28">
          <Suspense fallback={<RRGNganh du={{ rrg }} />}>
            <RRGNganhCoChuDe rrg={rrg} />
          </Suspense>
        </section>
      )}
      <section id="xep-hang-rs" className="scroll-mt-28">
        <BangRSNganh hang={tinhRSNganh(tatCa)} />
      </section>
      {/* Ban do nhiet chi can ~8 truong (ma, nganh, % ngay, RS20/RS60, diem, GTGD, von hoa - deu la truong khach cung duoc thay). KHONG gui nguyen dong tin hieu xuong trinh duyet: truoc 09/11/2026 trang nay lo gia mua / cat lo / TP / tin hieu cua moi ma cho ca khach
          (trai voi lib/lamSachChoKhach.js) va nang them ~1 MB. */}
      <section id="ban-do-nhiet" className="scroll-mt-28">
        <BanDoNhiet tatCa={tatCa.map((r) => ({ ma: r.ma, nganh: r.nganh, doi: r.doi, gtgd_tb20: r.gtgd_tb20, rs_vni: r.rs_vni, rs_vni_60: r.rs_vni_60, diem: r.diem, von_hoa_ty: r.von_hoa_ty }))} />
      </section>
      {/* Bang nhiet MUA VU (loi suat thang x nam, VN-Index + 22 nganh) - du lieu tinh lib/muaVuDuLieu.js, cap nhat bang scripts/capNhatMuaVu.mjs */}
      <section id="mua-vu" className="scroll-mt-28 mt-6">
        <BangNhietMuaVu />
      </section>
    </div>
  );
}
