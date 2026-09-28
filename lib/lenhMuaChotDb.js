import { withDb, daoDamBangLenhMuaChot, daoDamBangLenhDaDong } from "@/lib/db";
import { layTatCaTinHieu, xoaBoNhoTinHieu } from "@/lib/tinHieu";
import { ghiLenhDaDong } from "@/lib/lenhDaDong";
import { ungVienChotMua, danhGiaLenhMuaChot } from "@/lib/lenhMuaChot";

// LENH MUA DA CHOT TRONG KHUNG GIO - ghi / cap nhat moi lan upload tin hieu (logic: lib/lenhMuaChot.js). Goi SAU khi da ghi tin_hieu + lenh_da_dong + doi soat.
//  1. Dang trong khung gio: ghi cac lenh vua MUA / Mua moi (trung thi bo qua).
//  2. Moi lenh dang mo: he thong con giu -> de he thong quan ly; tin hieu mat -> web tu giu (chot TP, cat lo, ban khi diem thap 3 phien) - dong ban / cat lo van theo khung gio.
export async function capNhatLenhMuaChot({ trongKhung, ngay }) {
  const tatCa = await layTatCaTinHieu();
  const theoMa = new Map(tatCa.map((r) => [r.ma, r]));
  const ungVien = trongKhung ? ungVienChotMua(tatCa) : [];

  const { moi, dangMo, daGhiTheoLenh } = await withDb(async (client) => {
    await daoDamBangLenhMuaChot(client);
    await daoDamBangLenhDaDong(client);
    let moi = 0;
    if (ungVien.length) {
      const cot = (k) => ungVien.map((x) => x[k]);
      const kq = await client.query(
        `INSERT INTO lenh_mua_chot (ma, loai, ngay_mua, gia_mua, gia_kich_hoat, stop_loss, tp1, tp2, tp3)
         SELECT * FROM unnest($1::text[], $2::text[], $3::date[], $4::float8[], $5::float8[], $6::float8[], $7::float8[], $8::float8[], $9::float8[])
         ON CONFLICT (ma, loai, ngay_mua) DO NOTHING`,
        [cot("ma"), cot("loai"), cot("ngay_mua"), cot("gia_mua"), cot("gia_kich_hoat"), cot("stop_loss"), cot("tp1"), cot("tp2"), cot("tp3")]
      );
      moi = kq.rowCount;
    }
    const { rows: dangMo } = await client.query(
      `SELECT id, ma, loai, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, gia_mua, gia_kich_hoat, stop_loss, tp1, tp2, tp3, web_giu, tp_da_cham,
              so_phien_diem_thap, to_char(ngay_diem, 'YYYY-MM-DD') AS ngay_diem, diem_cuoi
       FROM lenh_mua_chot WHERE trang_thai = 'mo'`
    );
    const { rows: daGhi } = dangMo.length
      ? await client.query(
          `SELECT d.ma, to_char(d.ngay_mua, 'YYYY-MM-DD') AS ngay_mua, d.vong FROM lenh_da_dong d
           WHERE (d.ma, d.ngay_mua) IN (SELECT ma, ngay_mua FROM lenh_mua_chot WHERE trang_thai = 'mo')`
        )
      : { rows: [] };
    const daGhiTheoLenh = new Map();
    for (const d of daGhi) {
      const k = `${d.ma}|${d.ngay_mua}`;
      if (!daGhiTheoLenh.has(k)) daGhiTheoLenh.set(k, new Set());
      daGhiTheoLenh.get(k).add(Number(d.vong));
    }
    return { moi, dangMo, daGhiTheoLenh };
  });

  const dongMoi = [];
  const capNhat = [];
  for (const l of dangMo) {
    const kq = danhGiaLenhMuaChot({ l, row: theoMa.get(l.ma), daGhi: daGhiTheoLenh.get(`${l.ma}|${l.ngay_mua}`) ?? new Set(), ngay });
    dongMoi.push(...kq.dongMoi);
    capNhat.push({ id: l.id, ...kq.capNhat });
  }
  const daGhiDong = dongMoi.length ? await ghiLenhDaDong(dongMoi, { trongKhung }) : 0;
  if (capNhat.length) {
    await withDb((client) =>
      client.query(
        `UPDATE lenh_mua_chot AS l SET
           trang_thai = COALESCE(m.trang_thai, l.trang_thai),
           web_giu = m.web_giu,
           tp_da_cham = CASE WHEN m.co_tp THEN m.tp_da_cham ELSE l.tp_da_cham END,
           so_phien_diem_thap = COALESCE(m.so_phien_diem_thap, l.so_phien_diem_thap),
           ngay_diem = COALESCE(m.ngay_diem, l.ngay_diem),
           diem_cuoi = CASE WHEN m.ngay_diem IS NULL THEN l.diem_cuoi ELSE m.diem_cuoi END,
           cap_nhat_luc = now()
         FROM unnest($1::int[], $2::text[], $3::boolean[], $4::boolean[], $5::text[], $6::int[], $7::date[], $8::float8[])
              AS m(id, trang_thai, web_giu, co_tp, tp_da_cham, so_phien_diem_thap, ngay_diem, diem_cuoi)
         WHERE l.id = m.id`,
        [
          capNhat.map((c) => c.id),
          capNhat.map((c) => c.trang_thai ?? null),
          capNhat.map((c) => c.web_giu === true),
          capNhat.map((c) => "tp_da_cham" in c),
          capNhat.map((c) => c.tp_da_cham ?? null),
          capNhat.map((c) => c.so_phien_diem_thap ?? null),
          capNhat.map((c) => c.ngay_diem ?? null),
          capNhat.map((c) => c.diem_cuoi ?? null),
        ]
      )
    );
  }
  xoaBoNhoTinHieu(); // danh sach lenh web giu vua doi - cac trang doc lai
  return { moi, dangMo: dangMo.length, webGiu: capNhat.filter((c) => c.web_giu && c.trang_thai !== "dong").map((c) => dangMo.find((l) => l.id === c.id)?.ma), ghiDong: daGhiDong };
}
