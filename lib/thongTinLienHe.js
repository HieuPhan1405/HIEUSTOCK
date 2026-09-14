import { withDb, daoDamBangThongTinLienHe } from "@/lib/db";

// Doc cong khai - trang /lien-he can hien thi cho tat ca nguoi xem, khong
// can API key. Tra ve null neu chu web chua nhap gi ca.
export async function layThongTinLienHe() {
  return withDb(async (client) => {
    await daoDamBangThongTinLienHe(client);
    const { rows } = await client.query(`SELECT * FROM thong_tin_lien_he WHERE id = 1`);
    return rows[0] || null;
  });
}

// Ghi - chi tu /quan-tri (co API key). UPSERT vao dung 1 dong id=1.
export async function luuThongTinLienHe({ sdt, zalo, tiktok, facebook, nganHang, soTk, chuTk }) {
  return withDb(async (client) => {
    await daoDamBangThongTinLienHe(client);
    await client.query(
      `INSERT INTO thong_tin_lien_he (id, sdt, zalo, tiktok, facebook, ngan_hang, so_tk, chu_tk, cap_nhat_luc)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (id) DO UPDATE SET
         sdt = EXCLUDED.sdt, zalo = EXCLUDED.zalo, tiktok = EXCLUDED.tiktok,
         facebook = EXCLUDED.facebook, ngan_hang = EXCLUDED.ngan_hang,
         so_tk = EXCLUDED.so_tk, chu_tk = EXCLUDED.chu_tk, cap_nhat_luc = now()`,
      [sdt || null, zalo || null, tiktok || null, facebook || null, nganHang || null, soTk || null, chuTk || null]
    );
  });
}
