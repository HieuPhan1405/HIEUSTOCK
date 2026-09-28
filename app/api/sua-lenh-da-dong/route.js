import { withDb, daoDamBangLenhDaDong, daoDamBangLenhMuaChot } from "@/lib/db";

// QUAN TRI: SUA SO LENH DA DONG bang tay (vd 28/09/2026: 8 lenh "Thoat 22/09" do doi nguon du lieu AmiBroker -> engine real-time, sua theo du lieu san + luat cat lo trong khung gio).
// POST { thaoTac: [...], apDung } - header x-api-key giong cac route upload. apDung khac true: chi tra ve cac dong HIEN CO (xem truoc), khong ghi gi.
// Thao tac (chay trong 1 giao dich - loi 1 thao tac thi khong ghi gi):
//   { loai: "sua", ma, ngay_mua, vong, ngay_ban, gia_ban, lai_lo_pct, ly_do }  - sua 1 dong (so_phien de trong -> web tu dem theo lich phien; coi nhu da chot)
//   { loai: "xoa", ma, ngay_mua, vong }                                         - xoa 1 dong
//   { loai: "them", ma, ngay_mua, gia_mua, ngay_ban, gia_ban, lai_lo_pct, ly_do, da_cham_tp, phan_chot_pct, vong } - them 1 dong (trung khoa thi bo qua)
//   { loai: "giu_web", ma, loai_lenh ('goc'|'giua'), ngay_mua, gia_mua, stop_loss, tp1, tp2, tp3, tp_da_cham } - lenh van giu, web tu quan ly (lenh_mua_chot)
// Tra ve { truoc: cac dong lenh_da_dong cua cac lenh lien quan TRUOC khi sua (ban sao), ketQua }.
export const dynamic = "force-dynamic";

export async function POST(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ trangThai: "loi", thongBao: "Dữ liệu không đúng định dạng" }, { status: 400 });
  }
  const thaoTac = Array.isArray(body?.thaoTac) ? body.thaoTac : [];
  if (!thaoTac.length) return Response.json({ trangThai: "loi", thongBao: "Thiếu thaoTac" }, { status: 400 });

  try {
    return Response.json(
      await withDb(async (client) => {
        await daoDamBangLenhDaDong(client);
        await daoDamBangLenhMuaChot(client);
        const cacLenh = [...new Set(thaoTac.map((t) => `${t.ma}|${t.ngay_mua}`))];
        const { rows: truoc } = await client.query(
          `SELECT id, ma, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, gia_mua, to_char(ngay_ban, 'YYYY-MM-DD') AS ngay_ban, gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp,
                  phan_chot_pct, vong, chot_luc
           FROM lenh_da_dong WHERE (ma || '|' || to_char(ngay_mua, 'YYYY-MM-DD')) = ANY($1::text[]) ORDER BY ma, ngay_mua, vong`,
          [cacLenh]
        );
        if (body.apDung !== true) return { trangThai: "xem-truoc", truoc };

        const ketQua = [];
        await client.query("BEGIN");
        try {
          for (const t of thaoTac) {
            if (t.loai === "sua") {
              const r = await client.query(
                `UPDATE lenh_da_dong SET ngay_ban = $4::date, gia_ban = $5, lai_lo_pct = $6, ly_do = $7, so_phien = NULL, chot_luc = COALESCE(chot_luc, now()),
                        muc_cat_lo = NULL, thay_trong_khung = false
                 WHERE ma = $1 AND ngay_mua = $2::date AND vong = $3`,
                [t.ma, t.ngay_mua, t.vong, t.ngay_ban, t.gia_ban, t.lai_lo_pct, t.ly_do]
              );
              ketQua.push({ ...t, soDong: r.rowCount });
            } else if (t.loai === "xoa") {
              const r = await client.query(`DELETE FROM lenh_da_dong WHERE ma = $1 AND ngay_mua = $2::date AND vong = $3`, [t.ma, t.ngay_mua, t.vong]);
              ketQua.push({ ...t, soDong: r.rowCount });
            } else if (t.loai === "them") {
              const r = await client.query(
                `INSERT INTO lenh_da_dong (ma, ngay_mua, gia_mua, ngay_ban, gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct, vong, chot_luc)
                 VALUES ($1, $2::date, $3, $4::date, $5, $6, NULL, $7, $8, $9, $10, now()) ON CONFLICT (ma, ngay_mua, vong) DO NOTHING`,
                [t.ma, t.ngay_mua, t.gia_mua, t.ngay_ban, t.gia_ban, t.lai_lo_pct, t.ly_do, t.da_cham_tp ?? null, t.phan_chot_pct ?? 100, t.vong]
              );
              ketQua.push({ ...t, soDong: r.rowCount });
            } else if (t.loai === "giu_web") {
              const r = await client.query(
                `INSERT INTO lenh_mua_chot (ma, loai, ngay_mua, gia_mua, stop_loss, tp1, tp2, tp3, tp_da_cham, web_giu, trang_thai)
                 VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, true, 'mo')
                 ON CONFLICT (ma, loai, ngay_mua) DO UPDATE SET gia_mua = EXCLUDED.gia_mua, stop_loss = EXCLUDED.stop_loss, tp1 = EXCLUDED.tp1, tp2 = EXCLUDED.tp2,
                   tp3 = EXCLUDED.tp3, tp_da_cham = EXCLUDED.tp_da_cham, web_giu = true, trang_thai = 'mo', cap_nhat_luc = now()`,
                [t.ma, t.loai_lenh ?? "goc", t.ngay_mua, t.gia_mua, t.stop_loss ?? null, t.tp1 ?? null, t.tp2 ?? null, t.tp3 ?? null, t.tp_da_cham ?? null]
              );
              ketQua.push({ ...t, soDong: r.rowCount });
            } else throw new Error(`Thao tác không hợp lệ: ${t.loai}`);
          }
          await client.query("COMMIT");
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        }
        return { trangThai: "ok", truoc, ketQua };
      })
    );
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
