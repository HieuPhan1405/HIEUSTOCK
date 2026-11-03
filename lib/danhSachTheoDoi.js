import { withDb, daoDamBangDanhSachTheoDoi } from "@/lib/db";
import { LoiNguoiDung } from "@/lib/loiAnToan";
import { ID_CHINH, TEN_CHINH, GIOI_HAN, chuanHoaMa, chuanHoaTen, chuanHoaId } from "@/lib/danhSachTheoDoiThuan";

// NHIEU DANH SACH THEO DOI cua 1 tai khoan (04/11/2026). Danh sach CHINH = bang tham_gia_ma (giu nguyen y nghia cu: nut theo doi, so nguoi theo doi, thong bao
// "chi ma dang theo doi", lenh da dong tinh tu ngay theo doi); cac danh sach khac luu o danh_sach_theo_doi(_ma).
// Moi ma tra ve kem ngay them (YYYY-MM-DD, gio Viet Nam).

const NGAY = `to_char(tao_luc AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD')`;

async function docTatCa(client, nguoiDungId) {
  const [chinh, ds, ma] = await Promise.all([
    client.query(`SELECT ma, ${NGAY} AS ngay FROM tham_gia_ma WHERE nguoi_dung_id = $1 ORDER BY tao_luc DESC, ma`, [nguoiDungId]),
    client.query(`SELECT id, ten FROM danh_sach_theo_doi WHERE nguoi_dung_id = $1 ORDER BY tao_luc, id`, [nguoiDungId]),
    client.query(
      `SELECT m.danh_sach_id, m.ma, ${NGAY.replace("tao_luc", "m.tao_luc")} AS ngay
       FROM danh_sach_theo_doi_ma m JOIN danh_sach_theo_doi d ON d.id = m.danh_sach_id
       WHERE d.nguoi_dung_id = $1 ORDER BY m.tao_luc DESC, m.ma`,
      [nguoiDungId]
    ),
  ]);
  const theoDs = new Map(ds.rows.map((d) => [d.id, []]));
  for (const r of ma.rows) theoDs.get(r.danh_sach_id)?.push({ ma: r.ma, ngay: r.ngay });
  return [{ id: ID_CHINH, ten: TEN_CHINH, chinh: true, ma: chinh.rows }, ...ds.rows.map((d) => ({ id: d.id, ten: d.ten, chinh: false, ma: theoDs.get(d.id) }))];
}

export async function layDanhSachCuaToi(nguoiDungId) {
  if (!nguoiDungId) return null;
  return withDb(async (client) => {
    await daoDamBangDanhSachTheoDoi(client);
    return docTatCa(client, nguoiDungId);
  });
}

async function kiemTraChuSoHuu(client, nguoiDungId, id) {
  const { rows } = await client.query(`SELECT id FROM danh_sach_theo_doi WHERE id = $1 AND nguoi_dung_id = $2`, [id, nguoiDungId]);
  if (!rows.length) throw new LoiNguoiDung("Không tìm thấy danh sách này.");
}

async function soMaHienCo(client, nguoiDungId, id) {
  const { rows } =
    id === ID_CHINH
      ? await client.query(`SELECT COUNT(*)::int AS dem FROM tham_gia_ma WHERE nguoi_dung_id = $1`, [nguoiDungId])
      : await client.query(`SELECT COUNT(*)::int AS dem FROM danh_sach_theo_doi_ma WHERE danh_sach_id = $1`, [id]);
  return rows[0].dem;
}

async function themMa(client, nguoiDungId, id, dsMa) {
  if (!dsMa.length) return;
  const conCho = GIOI_HAN.soMa - (await soMaHienCo(client, nguoiDungId, id));
  if (conCho <= 0) throw new LoiNguoiDung(`Mỗi danh sách tối đa ${GIOI_HAN.soMa} mã.`);
  const them = dsMa.slice(0, conCho);
  if (id === ID_CHINH) {
    await client.query(`INSERT INTO tham_gia_ma (nguoi_dung_id, ma) SELECT $1::int, unnest($2::text[]) ON CONFLICT DO NOTHING`, [nguoiDungId, them]);
  } else {
    await client.query(`INSERT INTO danh_sach_theo_doi_ma (danh_sach_id, ma) SELECT $1::int, unnest($2::text[]) ON CONFLICT DO NOTHING`, [id, them]);
  }
}

// hanhDong: { loai: "tao" | "doiTen" | "xoa" | "them" | "bo", id, ten, ma: [..] }.
// Tra ve { danhSach (tat ca, sau khi doi), idMoi (khi tao), demThamGia: { ma: so nguoi } cho cac ma vua doi o danh sach chinh }.
export async function xuLyDanhSach(nguoiDungId, hanhDong) {
  const loai = hanhDong?.loai;
  const dsMa = chuanHoaMa(hanhDong?.ma ?? []);
  return withDb(async (client) => {
    await daoDamBangDanhSachTheoDoi(client);
    let idMoi = null;
    let maChinh = [];
    if (loai === "tao") {
      const ten = chuanHoaTen(hanhDong.ten);
      if (!ten) throw new LoiNguoiDung("Hãy đặt tên cho danh sách.");
      const { rows } = await client.query(`SELECT COUNT(*)::int AS dem FROM danh_sach_theo_doi WHERE nguoi_dung_id = $1`, [nguoiDungId]);
      if (rows[0].dem >= GIOI_HAN.soDanhSach - 1) throw new LoiNguoiDung(`Tối đa ${GIOI_HAN.soDanhSach} danh sách (kể cả danh sách chính).`);
      const { rows: moi } = await client.query(`INSERT INTO danh_sach_theo_doi (nguoi_dung_id, ten) VALUES ($1, $2) RETURNING id`, [nguoiDungId, ten]);
      idMoi = moi[0].id;
      await themMa(client, nguoiDungId, idMoi, dsMa);
    } else {
      const id = chuanHoaId(hanhDong?.id);
      if (id == null) throw new LoiNguoiDung("Danh sách không hợp lệ.");
      if (id !== ID_CHINH) await kiemTraChuSoHuu(client, nguoiDungId, id);
      if (loai === "doiTen" || loai === "xoa") {
        if (id === ID_CHINH) throw new LoiNguoiDung("Không đổi tên hay xoá được danh sách chính.");
        if (loai === "xoa") await client.query(`DELETE FROM danh_sach_theo_doi WHERE id = $1`, [id]);
        else {
          const ten = chuanHoaTen(hanhDong.ten);
          if (!ten) throw new LoiNguoiDung("Tên danh sách không được để trống.");
          await client.query(`UPDATE danh_sach_theo_doi SET ten = $1 WHERE id = $2`, [ten, id]);
        }
      } else if (loai === "them" || loai === "bo") {
        if (!dsMa.length) throw new LoiNguoiDung("Thiếu mã cổ phiếu.");
        if (loai === "them") await themMa(client, nguoiDungId, id, dsMa);
        else if (id === ID_CHINH) await client.query(`DELETE FROM tham_gia_ma WHERE nguoi_dung_id = $1 AND ma = ANY($2::text[])`, [nguoiDungId, dsMa]);
        else await client.query(`DELETE FROM danh_sach_theo_doi_ma WHERE danh_sach_id = $1 AND ma = ANY($2::text[])`, [id, dsMa]);
        if (id === ID_CHINH) maChinh = dsMa;
      } else throw new LoiNguoiDung("Thao tác không hợp lệ.");
    }
    let demThamGia = {};
    if (maChinh.length) {
      const { rows } = await client.query(`SELECT ma, COUNT(*)::int AS dem FROM tham_gia_ma WHERE ma = ANY($1::text[]) GROUP BY ma`, [maChinh]);
      demThamGia = Object.fromEntries(maChinh.map((m) => [m, rows.find((r) => r.ma === m)?.dem ?? 0]));
    }
    return { danhSach: await docTatCa(client, nguoiDungId), idMoi, demThamGia };
  });
}
