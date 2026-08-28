import { withDb, daoDamBangTinHieu } from "@/lib/db";

// Tra ve danh sach tin hieu hien tai cho frontend hien thi (Dashboard).
// GET /api/signals -> [{ ma, tin, diem, trend, mom, dt, adx, gia, doi, ... }]
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hangDL = await withDb(async (client) => {
      await daoDamBangTinHieu(client);
      const { rows } = await client.query(
        `SELECT ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh,
                vung_tham_gia, cap_nhat_luc
         FROM tin_hieu
         ORDER BY diem DESC NULLS LAST`
      );
      return rows;
    });

    return Response.json({ trangThai: "ok", capNhatLanCuoi: hangDL[0]?.cap_nhat_luc ?? null, tinHieu: hangDL });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
