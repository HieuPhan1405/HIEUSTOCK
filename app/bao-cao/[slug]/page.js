import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import KhungBaoCao from "@/components/KhungBaoCao";
import { BAO_CAO, layBaoCao } from "@/lib/baoCao";
import { taoMeta } from "@/lib/seo";

export function generateStaticParams() {
  return BAO_CAO.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const b = layBaoCao(slug);
  if (!b) return { title: "Báo cáo phân tích" };
  return taoMeta({ tieuDe: `${b.ma}: ${b.tieuDe.replace(/^[A-Z0-9]+:\s*/, "")} (báo cáo phân tích)`, moTa: b.moTa, duongDan: `/bao-cao/${b.slug}` });
}

// Trang 1 bao cao: tieu de + 4 y chinh (de co chu cho Google va nguoi doc nhanh) + khung nhung ban day du + nut tai PDF.
export default async function TrangMotBaoCao({ params }) {
  const { slug } = await params;
  const b = layBaoCao(slug);
  if (!b) notFound();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: "var(--chu)" }}>
      <Link href="/bao-cao" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--mo)" }}>
        <ArrowLeft size={14} aria-hidden="true" /> Tất cả báo cáo
      </Link>
      <h1 className="text-2xl sm:text-3xl mb-2 leading-tight" style={{ fontFamily: "var(--font-chu)", fontWeight: 800 }}>
        {b.tieuDe}
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--mo)" }}>
        {b.tenCongTy} ({b.ma}) · Số liệu đến {b.ngay} · Cập nhật {b.capNhat} · Khuyến nghị: <b style={{ color: "var(--xanh)" }}>{b.khuyenNghi}</b> · {b.nhanGia ?? "Giá mục tiêu"} {b.giaMucTieu.toLocaleString("vi-VN")} đồng
      </p>
      <ul className="list-disc pl-5 grid gap-1.5 text-sm mb-4 max-w-3xl">
        {b.diem.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <a href={b.pdf} download className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm mb-4" style={{ borderColor: "var(--vien)" }}>
        <Download size={14} aria-hidden="true" /> Tải bản PDF
      </a>
      <KhungBaoCao src={b.html} tieuDe={`Báo cáo phân tích ${b.ma}`} />
    </div>
  );
}
