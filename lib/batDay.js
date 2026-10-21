import { withDb, daoDamBangBatDay, daoDamBangTinHieu, daoDamBangDiemB } from "@/lib/db";

// Dung chung cho: trang /bat-day va API /api/upload-bat-day.
// LEFT JOIN voi tin_hieu de lay them GIA HIEN TAI (bat_day_su_kien chi luu
// gia TAI THOI DIEM tin hieu kich hoat trong qua khu, khong tu cap nhat) -
// LEFT (khong INNER) de van hien du lieu bat day ngay ca khi ma do vi ly do
// nao khong con trong lan quet tin_hieu gan nhat (vd bi huy niem yet).
export async function layTatCaBatDay() {
  return withDb(async (client) => {
    await daoDamBangBatDay(client);
    await daoDamBangTinHieu(client);
    await daoDamBangDiemB(client);
    // ngay_iso: ngay dang chuoi (loc theo phien); nganh: loc theo nganh; ngay_diem_b: diem B (diem mua phuc hoi) dau tien trong 30 ngay lich SAU tin hieu checklist (null neu chua co hoac chua co du lieu diem B truoc 2026)
    const { rows } = await client.query(
      `SELECT bd.*, to_char(bd.ngay_tin_hieu, 'YYYY-MM-DD') AS ngay_iso, th.gia AS gia_hien_tai, th.nganh,
              to_char(db.ngay_diem_b, 'YYYY-MM-DD') AS ngay_diem_b
       FROM bat_day_su_kien bd
       LEFT JOIN tin_hieu th ON th.ma = bd.ma
       LEFT JOIN LATERAL (
         SELECT MIN(b.ngay) AS ngay_diem_b FROM diem_b_su_kien b WHERE b.ma = bd.ma AND b.ngay >= bd.ngay_tin_hieu AND b.ngay <= bd.ngay_tin_hieu + 30
       ) db ON true
       ORDER BY bd.ngay_tin_hieu DESC, bd.ma ASC`
    );
    return rows;
  });
}
