import { layKhoiNgoaiMa, MA_NN_HOP_LE } from "@/lib/khoiNgoaiMa";
import { thongBaoLoi } from "@/lib/loiAnToan";

// Khoi ngoai mua / ban rong 10 phien gan nhat cua mot ma: GET /api/khoi-ngoai-ma?ma=FPT (du lieu thi truong cong khai, co cache ngan).
export async function GET(request) {
  const ma = String(new URL(request.url).searchParams.get("ma") || "").toUpperCase();
  if (!MA_NN_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });
  try {
    const phien = await layKhoiNgoaiMa(ma, 10);
    return Response.json({ trangThai: "ok", ma, phien }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
