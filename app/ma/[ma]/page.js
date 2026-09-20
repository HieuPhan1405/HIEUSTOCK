import Link from "next/link";
import { layTinHieuTheoMa } from "@/lib/tinHieu";
import { layDinhGia, layCauChuyen } from "@/lib/noiDung";
import ChiTietMa from "@/components/ChiTietMa";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { ma } = await params;
  const maHoa = String(ma || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return {
    title: maHoa ? `Cổ phiếu ${maHoa}` : "Chi tiết mã",
    description: maHoa ? `Tín hiệu, vùng mua, cắt lỗ và chốt lời của cổ phiếu ${maHoa}.` : undefined,
  };
}

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
      <div className="max-w-5xl mx-auto px-6 py-16" style={{ color: "#F5F5F7" }}>
        <p style={{ color: "#EF4444" }}>Lỗi tải dữ liệu: {loi}</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16" style={{ color: "#F5F5F7" }}>
        <p className="mb-4">
          Không tìm thấy mã <strong>{ma?.toUpperCase()}</strong> trong dữ liệu đã quét.
        </p>
        <Link href="/lenh-mo" className="text-sm" style={{ color: "#6C5CE7" }}>
          ← quay lại lệnh đang mở
        </Link>
      </div>
    );
  }

  // Loi khi tai Dinh gia/Cau chuyen KHONG duoc lam sap trang chi tiet ma -
  // day la du lieu bo sung, khong quan trong bang tin hieu chinh.
  let dinhGia = [];
  let cauChuyen = [];
  try {
    [dinhGia, cauChuyen] = await Promise.all([layDinhGia(ma), layCauChuyen(ma)]);
  } catch {
    // giu mang rong, ChiTietMa se tu hien "Dang cap nhat..."
  }

  return <ChiTietMa row={row} dinhGia={dinhGia} cauChuyen={cauChuyen} />;
}
