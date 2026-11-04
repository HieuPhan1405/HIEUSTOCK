import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layTrangThaiPhaVo, layLichSuPhaVo, layLichSuDai } from "@/lib/phaVoPhaiSinhDuLieu";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";

// Tin hieu pha vo trong ngay cho VN30F1M (thanh vien da duyet: chi cach bien dong 0,3; quan tri: ca khoang mo cua 15 phut):
//   GET /api/phai-sinh            -> trang thai phien hien tai (muc mua / ban / cat lo, lenh dang giu, nen 1 phut)
//   GET /api/phai-sinh?ngay=yyyy-mm-dd -> xem lai 1 ngay cu
//   GET /api/phai-sinh?lichSu=1   -> ket qua 20 phien gan nhat
//   GET /api/phai-sinh?lichSuDai=1 -> lich su cach bien dong 0,3 tu 2024 (ban chup + phien gan nhat; chi kieu bien dong)
// 05/11/2026: mo cho THANH VIEN DA DUYET nhung chi cach PHA VO BIEN DONG 0,3 (bo khoangMoCua khoi du lieu tra ve); quan tri / x-api-key / may dev xem du ca 2 kieu.
// Tra ve "day" (xem du), "bienDong" (thanh vien) hoac null (khong duoc xem).
async function quyenXem(request) {
  if (process.env.NODE_ENV !== "production") return "day";
  const key = request.headers.get("x-api-key");
  if (process.env.UPLOAD_API_KEY && key === process.env.UPLOAD_API_KEY) return "day";
  try {
    const nd = await layNguoiDungTuToken(request.cookies.get("cs_token")?.value);
    if (nd?.la_admin === true) return "day";
    return nd?.da_duyet ? "bienDong" : null;
  } catch {
    return null;
  }
}
const boKhoangMoCua = (x) => {
  if (!x || typeof x !== "object") return x;
  const { khoangMoCua, ...con } = x;
  return con;
};

export async function GET(request) {
  const quyen = await quyenXem(request);
  if (!quyen) return Response.json({ trangThai: "loi", thongBao: "Cần đăng nhập bằng tài khoản đã được duyệt." }, { status: 403 });
  const rutGon = (x) => (quyen === "day" ? x : boKhoangMoCua(x));
  const { searchParams } = new URL(request.url);
  try {
    if (searchParams.get("lichSu") === "1") {
      return Response.json({ trangThai: "ok", lichSu: quyen === "day" ? await layLichSuPhaVo() : (await layLichSuPhaVo()).map(rutGon) }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (searchParams.get("lichSuDai") === "1") {
      return Response.json({ trangThai: "ok", ...(await layLichSuDai()) }, { headers: { "Cache-Control": "private, max-age=300" } });
    }
    const ngay = searchParams.get("ngay");
    if (ngay && !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return Response.json({ trangThai: "loi", thongBao: "Ngày không hợp lệ" }, { status: 400 });
    return Response.json({ trangThai: "ok", ...rutGon(await layTrangThaiPhaVo({ ngay })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
