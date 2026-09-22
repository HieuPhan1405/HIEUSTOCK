import Link from "next/link";
import { layTinHieuTheoMa } from "@/lib/tinHieu";
import { layDinhGia, layCauChuyen } from "@/lib/noiDung";
import { layLichSuGiaoDichMa } from "@/lib/lenhDaDong";
import ChiTietMa from "@/components/ChiTietMa";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";
import { tenCongTy } from "@/lib/tenMa";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { ma } = await params;
  const maHoa = String(ma || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const t = tenCongTy(maHoa);
  return {
    title: maHoa ? (t ? `${maHoa} – ${t.ngan || t.ten}` : `Cổ phiếu ${maHoa}`) : "Chi tiết mã",
    description: maHoa ? `${t ? t.ten + ". " : ""}Tín hiệu, vùng mua, cắt lỗ và chốt lời của cổ phiếu ${maHoa}.` : undefined,
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
    // Ma co that tren san nhung chua nam trong danh sach he thong quet: chua co tin hieu, van xem duoc bieu do gia.
    const t = tenCongTy(ma);
    if (t) {
      return (
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16" style={{ color: "#F5F5F7" }}>
          <h1 className="text-xl leading-snug mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            {ma.toUpperCase()} <span style={{ fontWeight: 400, color: "#A6A6B3" }}>— {t.ten}</span>
          </h1>
          <p className="text-xs mb-1" style={{ color: "#8B8B99" }}>
            Sàn {t.san}
          </p>
          <p className="text-sm mb-5" style={{ color: "#8B8B99" }}>
            Mã này chưa nằm trong danh sách hệ thống quét tín hiệu nên chưa có điểm, vùng mua, cắt lỗ và chốt lời. Bạn vẫn xem được biểu đồ giá bên dưới.
          </p>
          <BieuDoKyThuat ma={ma.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)} />
        </div>
      );
    }
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

  // Loi khi tai Dinh gia/Cau chuyen/Lich su giao dich KHONG duoc lam sap trang chi tiet ma -
  // day la du lieu bo sung, khong quan trong bang tin hieu chinh.
  let dinhGia = [];
  let cauChuyen = [];
  let lichSuDaDong = [];
  try {
    [dinhGia, cauChuyen, lichSuDaDong] = await Promise.all([layDinhGia(ma), layCauChuyen(ma), layLichSuGiaoDichMa(ma)]);
  } catch {
    // giu mang rong, ChiTietMa se tu hien "Dang cap nhat..."
  }

  return <ChiTietMa row={row} dinhGia={dinhGia} cauChuyen={cauChuyen} lichSuDaDong={lichSuDaDong} />;
}
