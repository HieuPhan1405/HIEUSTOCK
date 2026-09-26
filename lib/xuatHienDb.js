// Ghi / doc bang tin_hieu_xuat_hien (NHAT KY TIN HIEU XUAT HIEN - xem lib/xuatHienTinHieu.js cho logic, lib/db.js cho bang).
import { withDb, daoDamBangXuatHien } from "@/lib/db";

// { hien, cuoi, mat } tu phatHienXuatHien -> ghi 1 lan moi loai bang unnest(). Tra ve so dong da ghi / cap nhat.
export async function ghiXuatHien({ hien, cuoi, mat }) {
  if (!hien.length && !cuoi.length && !mat.length) return { hien: 0, cuoi: 0, mat: 0 };
  return withDb(async (client) => {
    await daoDamBangXuatHien(client);
    const ra = { hien: 0, cuoi: 0, mat: 0 };
    if (hien.length) {
      const c = (k) => hien.map((x) => x[k]);
      // Hien LAI sau khi mat (cung ngay mua): giu gia / gio lan dau, chi bo co "mat".
      const { rowCount } = await client.query(
        `INSERT INTO tin_hieu_xuat_hien (ma, loai, ngay_mua, ngay_hien, gia_moc, gia_luc_hien, luc_hien, trong_phien)
         SELECT * FROM unnest($1::text[], $2::text[], $3::date[], $4::date[], $5::float8[], $6::float8[], $7::timestamptz[], $8::bool[])
         ON CONFLICT (ma, loai, ngay_mua) DO UPDATE SET mat_tin_hieu = FALSE`,
        [c("ma"), c("loai"), c("ngay_mua"), c("ngay_hien"), c("gia_moc"), c("gia_luc_hien"), c("luc_hien"), c("trong_phien")]
      );
      ra.hien = rowCount;
    }
    const capNhat = async (ds, set, them = "") => {
      if (!ds.length) return 0;
      const c = (k) => ds.map((x) => x[k]);
      const { rowCount } = await client.query(
        `UPDATE tin_hieu_xuat_hien t SET ${set}
         FROM unnest($1::text[], $2::text[], $3::date[], $4::float8[], $5::timestamptz[]) AS u(ma, loai, ngay_mua, gia, luc)
         WHERE t.ma = u.ma AND t.loai = u.loai AND t.ngay_mua = u.ngay_mua ${them}`,
        [c("ma"), c("loai"), c("ngay_mua"), c("gia"), c("luc")]
      );
      return rowCount;
    };
    ra.cuoi = await capNhat(cuoi, "gia_cuoi_ngay = u.gia, luc_cuoi_ngay = u.luc");
    ra.mat = await capNhat(mat, "mat_tin_hieu = TRUE, so_lan_mat = t.so_lan_mat + 1, luc_mat = u.luc, gia_luc_mat = u.gia", "AND t.mat_tin_hieu = FALSE");
    return ra;
  });
}

// Cac dong gan nhat (moi nhat truoc), ngay dang "yyyy-mm-dd".
export async function layXuatHien(gioiHan = 500) {
  return withDb(async (client) => {
    await daoDamBangXuatHien(client);
    const { rows } = await client.query(
      `SELECT ma, loai, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, to_char(ngay_hien, 'YYYY-MM-DD') AS ngay_hien, gia_moc, gia_luc_hien, luc_hien, trong_phien,
              gia_cuoi_ngay, luc_cuoi_ngay, mat_tin_hieu, so_lan_mat, luc_mat, gia_luc_mat
       FROM tin_hieu_xuat_hien ORDER BY luc_hien DESC LIMIT $1`,
      [gioiHan]
    );
    return rows;
  });
}
