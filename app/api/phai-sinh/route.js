import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layTrangThaiPhaVo, layLichSuPhaVo } from "@/lib/phaVoPhaiSinhDuLieu";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";

// Tin hieu pha vo trong ngay cho VN30F1M (cong cu CA NHAN cua quan tri, khong phai noi dung cho khach):
//   GET /api/phai-sinh            -> trang thai phien hien tai (muc mua / ban / cat lo, lenh dang giu, nen 1 phut)
//   GET /api/phai-sinh?ngay=yyyy-mm-dd -> xem lai 1 ngay cu
//   GET /api/phai-sinh?lichSu=1   -> ket qua 20 phien gan nhat
// Chi tai khoan quan tri (la_admin) hoac x-api-key; may dev (khong phai production) duoc xem de kiem thu.
async function duocXem(request) {
  if (process.env.NODE_ENV !== "production") return true;
  const key = request.headers.get("x-api-key");
  if (process.env.UPLOAD_API_KEY && key === process.env.UPLOAD_API_KEY) return true;
  try {
    const nd = await layNguoiDungTuToken(request.cookies.get("cs_token")?.value);
    return nd?.la_admin === true;
  } catch {
    return false;
  }
}

export async function GET(request) {
  if (!(await duocXem(request))) return Response.json({ trangThai: "loi", thongBao: "Chỉ dành cho quản trị." }, { status: 403 });
  const { searchParams } = new URL(request.url);
  try {
    if (searchParams.get("lichSu") === "1") {
      return Response.json({ trangThai: "ok", lichSu: await layLichSuPhaVo() }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const ngay = searchParams.get("ngay");
    if (ngay && !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return Response.json({ trangThai: "loi", thongBao: "Ngày không hợp lệ" }, { status: 400 });
    return Response.json({ trangThai: "ok", ...(await layTrangThaiPhaVo({ ngay })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
