import { layLenhDaDong } from "@/lib/lenhDaDong";
import { gomTheoLenh, thongKeLenhDaDong } from "@/lib/thongKeLenh";

// Xem thu cong toan bo bang Lenh da dong + thong ke (cach cu dem tung dong vs cach moi tinh theo tung lenh) de doi chieu con so o trang /lenh-da-dong.
// GET /api/lenh-da-dong-xem  (can header x-api-key giong cac route upload; chi doc, khong ghi gi).
export const dynamic = "force-dynamic";

export async function GET(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });
  try {
    const ds = await layLenhDaDong();
    const thang = ds.filter((x) => x.lai_lo_pct > 0).length;
    return Response.json({
      trangThai: "ok",
      soDong: ds.length,
      thongKeCuTheoDong: { soDong: ds.length, soThang: thang, tyLeThang: ds.length ? (thang / ds.length) * 100 : null },
      thongKeMoiTheoLenh: thongKeLenhDaDong(ds),
      lenh: gomTheoLenh(ds).map((n) => ({ ...n, tongGop: undefined, tongW: undefined, tongTrongSo: n.tongW, tongDongGop: n.tongGop })),
      dong: ds,
    });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
