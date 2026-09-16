import { withDb, daoDamBangBatDay, daoDamBangTinHieu } from "@/lib/db";

// Dung chung cho: trang /bat-day va API /api/upload-bat-day.
// LEFT JOIN voi tin_hieu de lay them GIA HIEN TAI (bat_day_su_kien chi luu
// gia TAI THOI DIEM tin hieu kich hoat trong qua khu, khong tu cap nhat) -
// LEFT (khong INNER) de van hien du lieu bat day ngay ca khi ma do vi ly do
// nao khong con trong lan quet tin_hieu gan nhat (vd bi huy niem yet).
export async function layTatCaBatDay() {
  return withDb(async (client) => {
    await daoDamBangBatDay(client);
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(
      `SELECT bd.*, th.gia AS gia_hien_tai
       FROM bat_day_su_kien bd
       LEFT JOIN tin_hieu th ON th.ma = bd.ma
       ORDER BY bd.ngay_tin_hieu DESC, bd.ma ASC`
    );
    return rows;
  });
}
