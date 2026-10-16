import { layAnhHuongIndex } from "@/lib/thiTruongHOSE";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

// Anh huong cua tung ma toi VN-Index trong phien moi nhat (so diem dong gop): GET /api/anh-huong-index
// ?ngay=yyyy-mm-dd -> phien gan nhat <= ngay do (vd ban tin sang tao luc dang trong phien can so cua phien hom truoc)
export async function GET(request) {
  const ngay = new URL(request.url).searchParams.get("ngay");
  if (ngay && !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return Response.json({ trangThai: "loi", thongBao: "Ngày không hợp lệ" }, { status: 400 });
  try {
    const kq = await layAnhHuongIndex(10, ngay || null);
    return Response.json({ trangThai: "ok", ...kq }, { headers: { "Cache-Control": kq.laHomNay ? "public, s-maxage=20, stale-while-revalidate=60" : !ngay && dangTrongPhienGiaoDich() ? "public, s-maxage=15, stale-while-revalidate=15" : "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
