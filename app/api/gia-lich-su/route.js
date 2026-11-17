import { layLichSuGia, layNenNoiNgay, gopNenTuan, gopNenThang, KHUNG_NOI_NGAY, MA_HOP_LE, SO_NEN_TOI_DA_DAI } from "@/lib/lichSuGia";
import { thongBaoLoi } from "@/lib/loiAnToan";

// Gia lich su OHLCV cho bieu do ky thuat: GET /api/gia-lich-su?ma=STB&kt=D|W|MO|H|M30|M15|M5  (D ngay, W tuan, H 1 gio, M30 / M15 / M5 phut; du lieu thi truong cong khai, co cache).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ma = String(searchParams.get("ma") || "").toUpperCase();
  const kt = searchParams.get("kt");
  const khungTG = kt === "W" ? "W" : kt === "MO" ? "MO" : kt in KHUNG_NOI_NGAY ? kt : "D";
  if (!MA_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });

  try {
    if (khungTG in KHUNG_NOI_NGAY) {
      const nen = await layNenNoiNgay(ma, khungTG);
      return Response.json({ trangThai: "ok", ma, khungTG, nen }, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } });
    }
    const ngay = await layLichSuGia(ma, khungTG === "MO" ? SO_NEN_TOI_DA_DAI : undefined);
    const nen = khungTG === "W" ? gopNenTuan(ngay) : khungTG === "MO" ? gopNenThang(ngay) : ngay;
    // s-maxage 20s de khop chu ky bieu do tu lam moi 30s (xem BieuDoKyThuat.js) - nen hom nay
    // ghep tu du lieu phut (lib/lichSuGia.js) nen can cache ngan de thuc su "chay" trong phien.
    return Response.json(
      { trangThai: "ok", ma, khungTG, nen },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } }
    );
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
