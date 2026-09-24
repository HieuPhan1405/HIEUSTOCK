import { layNenPhutHomNay, MA_HOP_LE } from "@/lib/lichSuGia";

// Thanh khoan trong phien (mac dinh VNINDEX, dai dien toan thi truong): GET /api/thanh-khoan?ma=VNINDEX
// Tra ve mang nen PHUT hom nay (khoi luong khop lenh tung phut) de ve duong tich luy o dashboard.
export async function GET(request) {
  const ma = String(new URL(request.url).searchParams.get("ma") || "VNINDEX").toUpperCase();
  if (!MA_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });

  try {
    const nen = await layNenPhutHomNay(ma);
    return Response.json({ trangThai: "ok", ma, nen }, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 502 });
  }
}
