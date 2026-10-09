import { layTatCaTinHieu } from "@/lib/tinHieu";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { lamSachChoKhach } from "@/lib/lamSachChoKhach";

// Tra ve danh sach tin hieu hien tai (dung cho kiem tra / tich hop - cac trang cua web doc truc tiep tu lib/tinHieu.js).
// KHOA THONG TIN QUAN TRONG (2026-10-09): chi thanh vien DA DUOC DUYET (cookie dang nhap) hoac khoa API quan tri (header x-api-key = UPLOAD_API_KEY) nhan DAY DU
// (tin hieu MUA/BAN, gia mua, cat lo, TP, mua giua chung...). Khach / tai khoan chua duyet chi nhan du lieu cong khai (gia, diem, chi bao, ten, von hoa...) - xem lib/lamSachChoKhach.js.
export const dynamic = "force-dynamic";

const KHONG_LUU = { "Cache-Control": "private, no-store" }; // 2 loai noi dung theo nguoi xem - khong cho CDN / trinh duyet dung chung

async function laThanhVienDaDuyet(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (dungKey && key === dungKey) return true;
  const nguoiDung = await layNguoiDungTuToken(request.cookies.get("cs_token")?.value).catch(() => null);
  return !!nguoiDung?.da_duyet;
}

export async function GET(request) {
  try {
    const [hangDL, day] = await Promise.all([layTatCaTinHieu(), laThanhVienDaDuyet(request)]);
    return Response.json(
      { trangThai: "ok", capNhatLanCuoi: hangDL[0]?.cap_nhat_luc ?? null, tinHieu: day ? hangDL : lamSachChoKhach(hangDL), ...(day ? {} : { duLieuRutGon: true }) },
      { headers: KHONG_LUU }
    );
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 500, headers: KHONG_LUU });
  }
}
