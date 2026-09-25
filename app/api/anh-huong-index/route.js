import { layAnhHuongIndex } from "@/lib/thiTruongHOSE";

// Anh huong cua tung ma toi VN-Index trong phien moi nhat (so diem dong gop): GET /api/anh-huong-index
export async function GET() {
  try {
    const kq = await layAnhHuongIndex(10);
    return Response.json({ trangThai: "ok", ...kq }, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 502 });
  }
}
