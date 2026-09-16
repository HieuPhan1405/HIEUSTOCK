import { withDb, daoDamBangThamGia } from "@/lib/db";

// Bam "Tham gia"/"Roi" 1 ma - INSERT neu chua tham gia, DELETE neu da tham
// gia roi (toggle 1 nut duy nhat). Tra ve trang thai MOI + tong so nguoi
// dang tham gia ma do de cap nhat ngay tren giao dien khong can tai lai trang.
export async function toggleThamGia(nguoiDungId, ma) {
  return withDb(async (client) => {
    await daoDamBangThamGia(client);
    const { rows: daCo } = await client.query(
      `SELECT id FROM tham_gia_ma WHERE nguoi_dung_id = $1 AND ma = $2`,
      [nguoiDungId, ma]
    );
    if (daCo.length > 0) {
      await client.query(`DELETE FROM tham_gia_ma WHERE id = $1`, [daCo[0].id]);
    } else {
      await client.query(
        `INSERT INTO tham_gia_ma (nguoi_dung_id, ma) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [nguoiDungId, ma]
      );
    }
    const { rows } = await client.query(`SELECT COUNT(*)::int AS dem FROM tham_gia_ma WHERE ma = $1`, [ma]);
    return { daThamGia: daCo.length === 0, soNguoiThamGia: rows[0].dem };
  });
}

// So nguoi tham gia MOI ma - dung cho Bo loc/So lenh mo hien tat ca 1 luc
// (tranh goi rieng tung dong).
export async function layDemThamGiaTatCa() {
  return withDb(async (client) => {
    await daoDamBangThamGia(client);
    const { rows } = await client.query(`SELECT ma, COUNT(*)::int AS dem FROM tham_gia_ma GROUP BY ma`);
    return Object.fromEntries(rows.map((r) => [r.ma, r.dem]));
  });
}

// Danh sach ma nguoi dung HIEN TAI da tham gia - de hien dung trang thai nut
// (da tham gia hay chua) ngay khi tai trang.
export async function layMaDaThamGia(nguoiDungId) {
  if (!nguoiDungId) return [];
  return withDb(async (client) => {
    await daoDamBangThamGia(client);
    const { rows } = await client.query(`SELECT ma FROM tham_gia_ma WHERE nguoi_dung_id = $1`, [nguoiDungId]);
    return rows.map((r) => r.ma);
  });
}
