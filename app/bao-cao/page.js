import Link from "next/link";
import { FileText, Download, ArrowRight } from "lucide-react";
import { BAO_CAO } from "@/lib/baoCao";
import { taoMeta } from "@/lib/seo";

export const metadata = taoMeta({
  tieuDe: "Báo cáo phân tích",
  moTa: "Báo cáo phân tích doanh nghiệp của Phan Hiếu Stock: bóc tách báo cáo tài chính, chất lượng lợi nhuận, định giá từng phần, DCF, kịch bản stress và kế hoạch giải ngân theo vùng giá.",
  duongDan: "/bao-cao",
});

const VIEN = "var(--vien)";
const PRIMARY = "#6C5CE7";

const fmtGia = (n) => n.toLocaleString("vi-VN");

// Trang danh sach bao cao phan tich: moi bao cao 1 the (xem tren web hoac tai PDF). Du lieu: lib/baoCao.js.
export default function TrangBaoCao() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: "var(--font-chu)", fontWeight: 800 }}>
        Báo cáo phân tích
      </h1>
      <p className="text-sm mb-6 max-w-3xl" style={{ color: "var(--mo)" }}>
        Báo cáo doanh nghiệp theo khung của công ty chứng khoán: cập nhật kết quả kinh doanh, bóc tách chất lượng lợi nhuận, định giá, kịch bản xấu và kế hoạch giải ngân theo vùng giá. Mỗi báo cáo có bản đọc trên web và bản PDF.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {BAO_CAO.map((b) => (
          <article key={b.slug} className="rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: VIEN, background: "var(--card)" }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--mo)" }}>
              <FileText size={14} aria-hidden="true" />
              <span style={{ fontWeight: 700, color: PRIMARY }}>{b.ma}</span>
              <span>· {b.tenCongTy}</span>
              <span className="ml-auto">{b.ngay}</span>
            </div>
            <h2 className="text-lg leading-snug" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
              <Link href={`/bao-cao/${b.slug}`} className="hover:underline">
                {b.tieuDe}
              </Link>
            </h2>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt style={{ color: "var(--mo)" }}>Khuyến nghị</dt>
                <dd style={{ fontWeight: 700, color: "var(--xanh)" }}>{b.khuyenNghi}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--mo)" }}>Giá mục tiêu</dt>
                <dd style={{ fontWeight: 700 }}>{fmtGia(b.giaMucTieu)}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--mo)" }}>Giá lúc viết</dt>
                <dd style={{ fontWeight: 700 }}>{fmtGia(b.giaHienTai)}</dd>
              </div>
            </dl>
            <p className="text-sm" style={{ color: "var(--mo)" }}>
              {b.moTa}
            </p>
            <div className="flex flex-wrap gap-2 mt-auto pt-1">
              <Link href={`/bao-cao/${b.slug}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white" style={{ background: PRIMARY, fontWeight: 600 }}>
                Đọc báo cáo <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <a href={b.pdf} download className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: VIEN }}>
                <Download size={14} aria-hidden="true" /> Tải PDF
              </a>
            </div>
          </article>
        ))}
      </div>
      <p className="text-xs mt-8 max-w-3xl" style={{ color: "var(--mo-3)" }}>
        Báo cáo chỉ nhằm mục đích tham khảo, không phải lời mời mua bán chứng khoán hay ý kiến tư vấn đầu tư cá nhân hóa. Nhà đầu tư tự chịu trách nhiệm với quyết định của mình.
      </p>
    </div>
  );
}
