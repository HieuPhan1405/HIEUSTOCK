import { withDb, daoDamBangBatDay } from "@/lib/db";

// Dung chung cho: trang /bat-day va API /api/upload-bat-day.
export async function layTatCaBatDay() {
  return withDb(async (client) => {
    await daoDamBangBatDay(client);
    const { rows } = await client.query(
      `SELECT * FROM bat_day_su_kien ORDER BY ngay_tin_hieu DESC, ma ASC`
    );
    return rows;
  });
}
