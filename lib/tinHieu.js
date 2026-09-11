import { withDb, daoDamBangTinHieu } from "@/lib/db";

const CAC_COT = `ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh,
                  vung_tham_gia, kijun, gg_top, gg_bot, dinh_52t, cap_nhat_luc`;

// Dung chung cho: API /api/signals, trang Tong quan thi truong, trang Lenh
// dang mo, va trang chi tiet 1 ma - tranh lap SQL o nhieu noi.
export async function layTatCaTinHieu() {
  return withDb(async (client) => {
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(
      `SELECT ${CAC_COT} FROM tin_hieu ORDER BY diem DESC NULLS LAST`
    );
    return rows;
  });
}

export async function layTinHieuTheoMa(ma) {
  if (!ma) return null;
  return withDb(async (client) => {
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(
      `SELECT ${CAC_COT} FROM tin_hieu WHERE ma = $1`,
      [ma.toUpperCase()]
    );
    return rows[0] || null;
  });
}
