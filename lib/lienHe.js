import { withDb, daoDamBangLienHe } from "@/lib/db";

// Nguoi xem web tu dien form cong khai - khong can API key, chi can chan
// spam co ban (do dai toi da, khong cho rong).
export async function themLienHe({ hoTen, lienLac, noiDung }) {
  return withDb(async (client) => {
    await daoDamBangLienHe(client);
    const { rows } = await client.query(
      `INSERT INTO lien_he (ho_ten, lien_lac, noi_dung) VALUES ($1, $2, $3) RETURNING id`,
      [hoTen.slice(0, 200), lienLac.slice(0, 200), noiDung.slice(0, 4000)]
    );
    return rows[0];
  });
}

// Chi dung tu trang /quan-tri (co API key) de xem tin nhan da gui.
export async function layTatCaLienHe() {
  return withDb(async (client) => {
    await daoDamBangLienHe(client);
    const { rows } = await client.query(`SELECT * FROM lien_he ORDER BY tao_luc DESC LIMIT 200`);
    return rows;
  });
}

export async function danhDauDaDoc(id) {
  return withDb(async (client) => {
    await daoDamBangLienHe(client);
    await client.query(`UPDATE lien_he SET da_doc = true WHERE id = $1`, [id]);
  });
}

export async function xoaLienHe(id) {
  return withDb(async (client) => {
    await daoDamBangLienHe(client);
    await client.query(`DELETE FROM lien_he WHERE id = $1`, [id]);
  });
}
