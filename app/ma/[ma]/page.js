import { notFound } from "next/navigation";
import { layTinHieuTheoMa } from "@/lib/tinHieu";
import { layDinhGia, layCauChuyen } from "@/lib/noiDung";
import { layLichSuGiaoDichMa } from "@/lib/lenhDaDong";
import { layLichPhien } from "@/lib/lichSuGia";
import ChiTietMa from "@/components/ChiTietMa";
import PhanTichCoBan from "@/components/PhanTichCoBan";
import { layPhanTichMa } from "@/lib/phanTichCoBanDb";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";
import { tenCongTy } from "@/lib/tenMa";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { lamSachMotDong } from "@/lib/lamSachChoKhach";
import { taoMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { ma } = await params;
  const maHoa = String(ma || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const t = tenCongTy(maHoa);
  if (!maHoa) return { title: "Chi tiết mã" };
  // Ma khong co ten tren san VA khong co trong du lieu quet -> 404 ngay o buoc metadata (truoc khi trang bat dau gui di, de tra dung ma 404).
  if (!t && !(await layTinHieuTheoMa(maHoa).catch(() => null))) notFound();
  // Ma khong co trong danh sach ten: trang tu goi notFound() neu ca DB cung khong co (Next tu them noindex cho trang 404).
  return taoMeta({
    tieuDe: `${maHoa}${t ? ` – ${t.ngan || t.ten}` : ""}: biểu đồ, điểm kỹ thuật, khối ngoại`,
    moTa: `${t ? `${t.ten} (${maHoa}, sàn ${t.san})` : `Cổ phiếu ${maHoa}`}: giá, điểm hợp lưu xu hướng · động lượng · dòng tiền, vùng hỗ trợ / kháng cự, khối ngoại 10 phiên, phân tích cơ bản và biểu đồ kỹ thuật.`,
    duongDan: `/ma/${maHoa}`,
  });
}

export default async function TrangChiTietMa({ params }) {
  const { ma } = await params;

  let row = null;
  let loi = null;
  // phan tich co ban la du lieu bo sung: loi / chua co thi bo qua, khong lam sap trang
  const dangTaiPhanTich = layPhanTichMa(ma).catch(() => null);
  try {
    row = await layTinHieuTheoMa(ma);
  } catch (e) {
    loi = thongBaoLoi(e);
  }

  const phanTichCB = await dangTaiPhanTich;
  // 11/11/2026 VA LO HONG: truoc day trang ma gui NGUYEN dong tin hieu cho ca khach (tin MUA/NAM GIU, gia mua, cat lo, TP, nhat ky lenh) trong khi trang chu / Bo loc da lam mo.
  // Khach chua dang nhap / chua duoc duyet: chi nhan cac truong cong khai (lib/lamSachChoKhach.js) + khong tai nhat ky lenh; giao dien hien khung moi dung thu.
  const nguoiDung = await layNguoiDungHienTai().catch(() => null);
  const khoa = !nguoiDung?.da_duyet;
  if (loi) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16" style={{ color: "var(--chu)" }}>
        <p style={{ color: "var(--do)" }}>Lỗi tải dữ liệu: {loi}</p>
      </div>
    );
  }

  if (!row) {
    // Ma co that tren san nhung chua nam trong danh sach he thong quet: chua co tin hieu, van xem duoc bieu do gia.
    const t = tenCongTy(ma);
    if (t) {
      return (
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16" style={{ color: "var(--chu)" }}>
          <h1 className="text-xl leading-snug mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            {ma.toUpperCase()} <span style={{ fontWeight: 400, color: "var(--mo-2)" }}>— {t.ten}</span>
          </h1>
          <p className="text-xs mb-1" style={{ color: "var(--mo)" }}>
            Sàn {t.san}
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--mo)" }}>
            Mã này chưa nằm trong danh sách hệ thống quét tín hiệu nên chưa có điểm, vùng mua, cắt lỗ và chốt lời. Bạn vẫn xem được biểu đồ giá bên dưới.
          </p>
          <BieuDoKyThuat tenMa={t?.ten ?? null} ma={ma.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)} />
          {phanTichCB && (
            <div className="mt-6">
              <PhanTichCoBan du={phanTichCB} ma={ma.toUpperCase()} />
            </div>
          )}
        </div>
      );
    }
    // Ma khong ton tai tren san: tra 404 that (truoc tra 200 nen Google van lap chi muc trang rong).
    notFound();
  }

  // Loi khi tai Dinh gia/Cau chuyen/Lich su giao dich KHONG duoc lam sap trang chi tiet ma -
  // day la du lieu bo sung, khong quan trong bang tin hieu chinh.
  let dinhGia = [];
  let cauChuyen = [];
  let lichSuDaDong = [];
  let lichPhien = [];
  try {
    [dinhGia, cauChuyen, lichSuDaDong, lichPhien] = await Promise.all([layDinhGia(ma), layCauChuyen(ma), khoa ? [] : layLichSuGiaoDichMa(ma), layLichPhien()]);
  } catch {
    // giu mang rong, ChiTietMa se tu hien "Dang cap nhat..."
  }

  return <ChiTietMa row={khoa ? lamSachMotDong(row) : row} khoa={khoa} dinhGia={dinhGia} cauChuyen={cauChuyen} lichSuDaDong={lichSuDaDong} lichPhien={lichPhien} phanTich={phanTichCB} />;
}
