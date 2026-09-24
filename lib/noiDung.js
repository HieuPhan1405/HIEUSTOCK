import { withDb, daoDamBangNoiDung } from "@/lib/db";

// Dinh gia tham khao + Cau chuyen ky vong - nhap tay qua /quan-tri, khong co
// nguon tu dong (AmiBroker khong co du lieu nay).

// Chi lay bao cao MOI NHAT cua moi cong ty CK (DISTINCT ON) - 1 CTCK ra nhieu bao cao theo thoi
// gian cho cung 1 ma thi chi bao cao gan day nhat con y nghia tham khao, cac ban cu hon chi de
// luu lich su trong DB (van xoa duoc tu /quan-tri) chu khong hien cho nguoi dung.
export async function layDinhGia(ma) {
  return withDb(async (client) => {
    await daoDamBangNoiDung(client);
    const { rows } = await client.query(
      `SELECT DISTINCT ON (cong_ty_ck) id, ma, cong_ty_ck, ngay_dinh_gia, gia_muc_tieu, khuyen_nghi, tao_luc
       FROM dinh_gia WHERE ma = $1
       ORDER BY cong_ty_ck, ngay_dinh_gia DESC NULLS LAST, tao_luc DESC`,
      [ma.toUpperCase()]
    );
    rows.sort((a, b) => new Date(b.ngay_dinh_gia ?? b.tao_luc) - new Date(a.ngay_dinh_gia ?? a.tao_luc));
    return rows;
  });
}

export async function themDinhGia({ ma, congTyCK, ngayDinhGia, giaMucTieu, khuyenNghi }) {
  return withDb(async (client) => {
    await daoDamBangNoiDung(client);
    const { rows } = await client.query(
      `INSERT INTO dinh_gia (ma, cong_ty_ck, ngay_dinh_gia, gia_muc_tieu, khuyen_nghi)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [ma.toUpperCase(), congTyCK, ngayDinhGia || null, giaMucTieu, khuyenNghi || null]
    );
    return rows[0];
  });
}

export async function xoaDinhGia(id) {
  return withDb(async (client) => {
    await daoDamBangNoiDung(client);
    await client.query(`DELETE FROM dinh_gia WHERE id = $1`, [id]);
  });
}

export async function layCauChuyen(ma) {
  return withDb(async (client) => {
    await daoDamBangNoiDung(client);
    const { rows } = await client.query(
      `SELECT id, ma, loai, noi_dung, ngay, tao_luc
       FROM cau_chuyen WHERE ma = $1 ORDER BY ngay DESC NULLS LAST, tao_luc DESC`,
      [ma.toUpperCase()]
    );
    return rows;
  });
}

export async function themCauChuyen({ ma, loai, noiDung, ngay }) {
  return withDb(async (client) => {
    await daoDamBangNoiDung(client);
    const { rows } = await client.query(
      `INSERT INTO cau_chuyen (ma, loai, noi_dung, ngay)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [ma.toUpperCase(), loai, noiDung, ngay || null]
    );
    return rows[0];
  });
}

export async function xoaCauChuyen(id) {
  return withDb(async (client) => {
    await daoDamBangNoiDung(client);
    await client.query(`DELETE FROM cau_chuyen WHERE id = $1`, [id]);
  });
}
