import { withDb, daoDamBangLenhMuaChot } from "@/lib/db";

// Xem thu cong bang lenh_mua_chot (lenh MUA / Mua moi da chot trong khung gio, web tu giu khi tin hieu mat) de chan doan.
// GET /api/lenh-mua-chot-xem?ma=GVR  (can header x-api-key giong cac route admin; CHI DOC, khong ghi gi). Khong co ma: 60 dong cap nhat gan nhat.
export const dynamic = "force-dynamic";

export async function GET(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });
  const ma = String(new URL(request.url).searchParams.get("ma") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  try {
    const dong = await withDb(async (client) => {
      await daoDamBangLenhMuaChot(client);
      const { rows } = ma
        ? await client.query(`SELECT * FROM lenh_mua_chot WHERE ma = $1 ORDER BY ngay_mua, loai`, [ma])
        : await client.query(`SELECT * FROM lenh_mua_chot ORDER BY cap_nhat_luc DESC NULLS LAST LIMIT 60`);
      return rows;
    });
    return Response.json({ trangThai: "ok", ma: ma || null, soDong: dong.length, dong });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
