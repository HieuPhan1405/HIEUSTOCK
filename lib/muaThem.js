import { withDb, daoDamBangMuaThemCaNhan } from "@/lib/db";

// Lua chon "da mua dot dau chua" cua 1 nguoi dung cho tung diem mua moi (xem daoDamBangMuaThemCaNhan).
// Tra ve object { "MA|vong|yyyy-mm-dd": true/false } de trang tra nhanh theo khoa.
export async function layMuaThemCuaToi(nguoiDungId) {
  if (!nguoiDungId) return {};
  return withDb(async (client) => {
    await daoDamBangMuaThemCaNhan(client);
    const { rows } = await client.query(
      `SELECT ma, vong, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, da_mua_dot_dau FROM mua_them_ca_nhan WHERE nguoi_dung_id = $1`,
      [nguoiDungId]
    );
    return Object.fromEntries(rows.map((r) => [`${r.ma}|${r.vong}|${r.ngay_mua}`, r.da_mua_dot_dau]));
  });
}

export async function datMuaThem(nguoiDungId, { ma, vong, ngayMua, daMuaDotDau }) {
  return withDb(async (client) => {
    await daoDamBangMuaThemCaNhan(client);
    await client.query(
      `INSERT INTO mua_them_ca_nhan (nguoi_dung_id, ma, vong, ngay_mua, da_mua_dot_dau)
       VALUES ($1, $2, $3, $4::date, $5)
       ON CONFLICT (nguoi_dung_id, ma, vong, ngay_mua) DO UPDATE SET da_mua_dot_dau = EXCLUDED.da_mua_dot_dau, cap_nhat_luc = now()`,
      [nguoiDungId, ma, vong, ngayMua, !!daMuaDotDau]
    );
  });
}
