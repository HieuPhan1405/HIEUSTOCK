import { layBangCoBan } from "@/lib/phanTichCoBanDb";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import BangCoBan from "@/components/BangCoBan";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { donCot } from "@/lib/goiCot";
import { taoMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = taoMeta({
  tieuDe: "Bộ lọc cơ bản",
  moTa: "Lọc toàn thị trường theo điểm Z (Altman), điểm F (Piotroski), ROE, P/E, P/B, tăng trưởng lợi nhuận, cổ tức và điểm Đánh giá 360.",
  duongDan: "/co-ban",
});

export default async function TrangCoBan() {
  let hang = [];
  let capNhat = null;
  let loi = null;
  try {
    // thanh khoan (GTGD TB20, ty dong/phien) lay tu bang tin hieu de loc ma it thanh khoan - loi o day chi mat cot nay
    const [cb, tin] = await Promise.all([layBangCoBan(), layTatCaTinHieu().catch(() => [])]);
    const gtgd = new Map(tin.map((r) => [r.ma, r.gtgd_tb20 == null ? null : Number(r.gtgd_tb20)]));
    hang = cb.hang.map((h) => ({ ...h, gtgd: gtgd.get(h.ma) ?? null }));
    capNhat = cb.capNhat;
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Bộ lọc cơ bản
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--mo)" }}>
        Lọc {hang.length || "toàn bộ"} cổ phiếu theo chất lượng doanh nghiệp (báo cáo tài chính theo quý): sức khoẻ tài chính, ROE, định giá, tăng trưởng, cổ tức. Bấm một mã để xem phân tích đầy đủ.
      </p>
      {loi && (
        <p className="text-sm mb-6" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}
      {!loi && hang.length === 0 && (
        <p className="text-sm" style={{ color: "var(--mo)" }}>
          Chưa có dữ liệu phân tích cơ bản.
        </p>
      )}
      {/* Gui DANG COT (lib/goiCot.js): ten truong 1 lan thay vi lap lai o ~400 dong */}
      {hang.length > 0 && <BangCoBan hangGon={donCot(hang)} capNhat={capNhat ? new Date(capNhat).toISOString() : null} />}
    </div>
  );
}
