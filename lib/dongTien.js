import { withDb, daoDamBangDongTien } from "@/lib/db";

// DOC dong tien thoi gian thuc (xem lib/db.js daoDamBangDongTien, engine/dich-vu/dongTienRealTime.mjs). Nho 10 giay trong bo nho instance de nhieu nguoi mo cung luc chi truy van DB 1 lan
// (moi phan duoc nho RIENG: thi truong ~10 KB, 1 ma ~10 KB co chi tiet).
const HAN_MS = 10_000;
const kho = new Map();
async function nho(khoa, taiFn) {
  const e = kho.get(khoa);
  if (e?.gt !== undefined && Date.now() - e.luc < HAN_MS) return e.gt;
  if (e?.dangTai) return e.dangTai;
  const dangTai = taiFn().then(
    (gt) => {
      kho.set(khoa, { luc: Date.now(), gt, dangTai: null });
      return gt;
    },
    (loi) => {
      kho.delete(khoa);
      throw loi;
    }
  );
  kho.set(khoa, { luc: e?.luc ?? 0, gt: e?.gt, dangTai });
  return dangTai;
}

// { ngay, capNhat, ...thiTruong } cua ngay moi nhat co du lieu, hoac null
export function layDongTienThiTruong() {
  return nho("thi-truong", () =>
    withDb(async (client) => {
      await daoDamBangDongTien(client);
      const { rows } = await client.query(`SELECT to_char(ngay, 'YYYY-MM-DD') AS ngay, du_lieu, cap_nhat FROM dong_tien_thi_truong ORDER BY ngay DESC LIMIT 1`);
      return rows[0] ? { ngay: rows[0].ngay, capNhat: rows[0].cap_nhat, ...rows[0].du_lieu } : null;
    })
  );
}

// { ma, ngay, capNhat, tomTat, chiTiet, lichSu: [{ ngay, tomTat }] (toi da 6 ngay truoc) } cua 1 ma, hoac null
export function layDongTienMa(ma) {
  const m = String(ma || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  if (!m) return Promise.resolve(null);
  return nho(`ma:${m}`, () =>
    withDb(async (client) => {
      await daoDamBangDongTien(client);
      const { rows } = await client.query(
        `SELECT to_char(ngay, 'YYYY-MM-DD') AS ngay, tom_tat, chi_tiet, cap_nhat FROM dong_tien_ma WHERE ma = $1 ORDER BY ngay DESC LIMIT 7`,
        [m]
      );
      if (!rows.length) return null;
      const [homNay, ...cu] = rows;
      return { ma: m, ngay: homNay.ngay, capNhat: homNay.cap_nhat, tomTat: homNay.tom_tat, chiTiet: homNay.chi_tiet, lichSu: cu.map((r) => ({ ngay: r.ngay, tomTat: r.tom_tat })) };
    })
  );
}
