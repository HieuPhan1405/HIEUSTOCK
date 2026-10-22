import { withDb, daoDamBangDiemB, daoDamBangTinHieu, daoDamBangLenhDaDong } from "@/lib/db";

// Lich su DIEM MUA PHUC HOI (diem B) cho trang /mua-phuc-hoi. LEFT JOIN tin_hieu lay gia hien tai / nganh / tin hieu he thong; "co_mua_thuong_truoc" = web da co lenh MUA cua he thong trong 60 ngay lich TRUOC ngay diem B
// (lenh da dong trong lenh_da_dong, hoac lenh dang giu trong tin_hieu) - chi dua tren du lieu lenh co tren web nen cac lenh truoc khi web ghi nhan khong tinh duoc.
export async function layLichSuDiemB() {
  return withDb(async (client) => {
    await daoDamBangDiemB(client);
    await daoDamBangTinHieu(client);
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT d.id, d.ma, to_char(d.ngay, 'YYYY-MM-DD') AS ngay, d.gia_b, d.giam, d.kl_day, d.day_20, d.sl, d.tp1, d.tp2, d.tp3, d.gia_vao, d.pct_sau_5, d.pct_sau_10, d.pct_sau_20, d.vni_yeu, d.gtgd, to_char(d.ngay_cat_lo, 'YYYY-MM-DD') AS ngay_cat_lo, d.tp_cham,
              th.gia AS gia_hien_tai, th.nganh, th.tin AS tin_he_thong,
              (EXISTS (SELECT 1 FROM lenh_da_dong l WHERE l.ma = d.ma AND l.vong = 1 AND l.ngay_mua < d.ngay AND l.ngay_mua >= d.ngay - 60)
               OR (th.ngay_mua IS NOT NULL AND th.ngay_mua < d.ngay AND th.ngay_mua >= d.ngay - 60)) AS co_mua_thuong_truoc
       FROM diem_b_su_kien d
       LEFT JOIN tin_hieu th ON th.ma = d.ma
       ORDER BY d.ngay DESC, d.ma ASC`
    );
    return rows;
  });
}
