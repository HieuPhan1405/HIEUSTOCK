import { layNenGio, MA_HOP_LE } from "@/lib/lichSuGia";
import { thongBaoLoi } from "@/lib/loiAnToan";

// Nen 1 GIO cho Volume Profile tren bieu do: GET /api/gia-gio?ma=HPG -> { trangThai, ma, nen: [[t, o, h, l, c, v], ...] } (du lieu thi truong cong khai, co cache 10 phut).
// Chi duoc goi khi nguoi dung bat Volume Profile; nguon khong co du lieu thi tra mang rong (bieu do tu dung nen ngay).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ma = String(searchParams.get("ma") || "").toUpperCase();
  if (!MA_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });
  try {
    const nen = await layNenGio(ma);
    return Response.json({ trangThai: "ok", ma, nen }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
