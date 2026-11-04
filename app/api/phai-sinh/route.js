import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layTrangThaiPhaVo, layLichSuPhaVo, layLichSuDai } from "@/lib/phaVoPhaiSinhDuLieu";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";

// Tin hieu pha vo trong ngay cho VN30F1M (chi cach bien dong 0,3, thanh vien da duyet):
//   GET /api/phai-sinh            -> trang thai phien hien tai (muc mua / ban / cat lo, lenh dang giu, nen 1 phut)
//   GET /api/phai-sinh?ngay=yyyy-mm-dd -> xem lai 1 ngay cu
//   GET /api/phai-sinh?lichSu=1   -> ket qua 20 phien gan nhat
//   GET /api/phai-sinh?lichSuDai=1 -> lich su cach bien dong 0,3 tu 2024 (ban chup + phien gan nhat)
// 05/11/2026: CHI cach PHA VO BIEN DONG 0,3 (cat lo doi len gia vao + 2 diem khi lai 7 diem); mo cho thanh vien da duyet, quan tri, x-api-key va may dev.
async function duocXem(request) {
  if (process.env.NODE_ENV !== "production") return true;
  const key = request.headers.get("x-api-key");
  if (process.env.UPLOAD_API_KEY && key === process.env.UPLOAD_API_KEY) return true;
  try {
    const nd = await layNguoiDungTuToken(request.cookies.get("cs_token")?.value);
    return nd?.la_admin === true || nd?.da_duyet === true;
  } catch {
    return false;
  }
}

export async function GET(request) {
  if (!(await duocXem(request))) return Response.json({ trangThai: "loi", thongBao: "Cần đăng nhập bằng tài khoản đã được duyệt." }, { status: 403 });
  const { searchParams } = new URL(request.url);
  try {
    if (searchParams.get("lichSu") === "1") {
      return Response.json({ trangThai: "ok", lichSu: await layLichSuPhaVo() }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (searchParams.get("lichSuDai") === "1") {
      return Response.json({ trangThai: "ok", ...(await layLichSuDai()) }, { headers: { "Cache-Control": "private, max-age=300" } });
    }
    const ngay = searchParams.get("ngay");
    if (ngay && !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return Response.json({ trangThai: "loi", thongBao: "Ngày không hợp lệ" }, { status: 400 });
    return Response.json({ trangThai: "ok", ...(await layTrangThaiPhaVo({ ngay })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
