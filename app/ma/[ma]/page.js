import Link from "next/link";
import { layTinHieuTheoMa } from "@/lib/tinHieu";
import ChiTietMa from "@/components/ChiTietMa";

export const dynamic = "force-dynamic";

export default async function TrangChiTietMa({ params }) {
  const { ma } = await params;

  let row = null;
  let loi = null;
  try {
    row = await layTinHieuTheoMa(ma);
  } catch (e) {
    loi = String(e?.message || e);
  }

  if (loi) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16" style={{ color: "#EDE7DD" }}>
        <p style={{ color: "#E86A6A" }}>Lỗi tải dữ liệu: {loi}</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16" style={{ color: "#EDE7DD" }}>
        <p className="mb-4">
          Không tìm thấy mã <strong>{ma?.toUpperCase()}</strong> trong dữ liệu đã quét.
        </p>
        <Link href="/lenh-mo" className="text-sm" style={{ color: "#E8873A" }}>
          ← quay lại lệnh đang mở
        </Link>
      </div>
    );
  }

  return <ChiTietMa row={row} />;
}
