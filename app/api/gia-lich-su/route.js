import { layLichSuGia, gopNenTuan, MA_HOP_LE } from "@/lib/lichSuGia";

// Gia lich su OHLCV cho bieu do ky thuat: GET /api/gia-lich-su?ma=STB&kt=D|W  (du lieu thi truong cong khai, co cache).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ma = String(searchParams.get("ma") || "").toUpperCase();
  const khungTG = searchParams.get("kt") === "W" ? "W" : "D";
  if (!MA_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });

  try {
    const ngay = await layLichSuGia(ma);
    const nen = khungTG === "W" ? gopNenTuan(ngay) : ngay;
    // s-maxage 20s de khop chu ky bieu do tu lam moi 30s (xem BieuDoKyThuat.js) - nen hom nay
    // ghep tu du lieu phut (lib/lichSuGia.js) nen can cache ngan de thuc su "chay" trong phien.
    return Response.json(
      { trangThai: "ok", ma, khungTG, nen },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } }
    );
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 502 });
  }
}
