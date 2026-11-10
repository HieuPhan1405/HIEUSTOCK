import { withDb, daoDamBangBoLocLuu } from "@/lib/db";
import { LoiNguoiDung } from "@/lib/loiAnToan";
import { DUOC_XEM } from "@/lib/nguoiDung";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { COT_CHI_BAO } from "@/lib/cotChiBaoKyThuat";
import { GIOI_HAN_BO_LOC, chuanHoaDinhNghia, chuanHoaTenBoLoc, coDieuKienLoc, locTheoDinhNghia } from "@/lib/boLocLuuThuan";

// BO LOC CA NHAN: luu bo loc co phieu theo tai khoan + thong bao ve may khi co ma MOI khop (12/11/2026). Phan thuan (loc, chuan hoa): lib/boLocLuuThuan.js.
// Bang bo_loc_luu: xem daoDamBangBoLocLuu trong lib/db.js. Thong bao day dung chung ha tang Web Push (lib/thongBaoDb.js guiDay).

// Gop cot chi bao ky thuat (RSI, MACD, MA...) vao tung dong tin hieu - dung cho trang Bo loc va cho viec do bo loc luu o may chu. chiBao = { hang }.
export function gopChiBao(tatCa, chiBao) {
  if (!chiBao?.hang) return tatCa;
  const theoMa = new Map(chiBao.hang.map((h) => [h.ma, h]));
  // Du lieu duoc gui nguyen xuong trinh duyet (~390 ma x hon 100 cot): BO cot khong co gia tri (null) va lam tron so thap phan dai (7 chu so co nghia).
  return tatCa.map((r) => {
    const h = theoMa.get(r.ma);
    if (!h) return r;
    const o = { ...r };
    for (const k of COT_CHI_BAO) {
      const v = h[k];
      if (v != null) o[k] = typeof v === "number" && !Number.isInteger(v) ? Number(v.toPrecision(7)) : v;
    }
    return o;
  });
}

const hang = (r) => ({ id: r.id, ten: r.ten, dinhNghia: r.dinh_nghia, baoVeMay: r.bao_ve_may === true });

async function docTatCa(client, nguoiDungId) {
  const { rows } = await client.query(`SELECT id, ten, dinh_nghia, bao_ve_may FROM bo_loc_luu WHERE nguoi_dung_id = $1 ORDER BY tao_luc, id`, [nguoiDungId]);
  return rows.map(hang);
}

export async function layBoLocCuaToi(nguoiDungId) {
  if (!nguoiDungId) return null;
  return withDb(async (client) => {
    await daoDamBangBoLocLuu(client);
    return docTatCa(client, nguoiDungId);
  });
}

const chuanHoaId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

// hanhDong: { loai: "tao" | "capNhat" | "doiTen" | "xoa" | "baoVeMay", id, ten, dinhNghia, bat }. Tra ve { danhSach, idMoi }.
export async function xuLyBoLoc(nguoiDungId, hanhDong) {
  const loai = hanhDong?.loai;
  return withDb(async (client) => {
    await daoDamBangBoLocLuu(client);
    let idMoi = null;
    if (loai === "tao") {
      const ten = chuanHoaTenBoLoc(hanhDong.ten);
      if (!ten) throw new LoiNguoiDung("Hãy đặt tên cho bộ lọc.");
      const dn = chuanHoaDinhNghia(hanhDong.dinhNghia);
      if (!coDieuKienLoc(dn)) throw new LoiNguoiDung("Bộ lọc đang trống — hãy chọn ít nhất một điều kiện trước khi lưu.");
      const { rows: dem } = await client.query(`SELECT COUNT(*)::int AS dem FROM bo_loc_luu WHERE nguoi_dung_id = $1`, [nguoiDungId]);
      if (dem[0].dem >= GIOI_HAN_BO_LOC.soBoLoc) throw new LoiNguoiDung(`Tối đa ${GIOI_HAN_BO_LOC.soBoLoc} bộ lọc. Hãy xoá bớt bộ lọc cũ.`);
      const { rows } = await client.query(`INSERT INTO bo_loc_luu (nguoi_dung_id, ten, dinh_nghia) VALUES ($1, $2, $3::jsonb) RETURNING id`, [nguoiDungId, ten, JSON.stringify(dn)]);
      idMoi = rows[0].id;
    } else {
      const id = chuanHoaId(hanhDong?.id);
      if (id == null) throw new LoiNguoiDung("Bộ lọc không hợp lệ.");
      const { rows: co } = await client.query(`SELECT id FROM bo_loc_luu WHERE id = $1 AND nguoi_dung_id = $2`, [id, nguoiDungId]);
      if (!co.length) throw new LoiNguoiDung("Không tìm thấy bộ lọc này.");
      if (loai === "xoa") await client.query(`DELETE FROM bo_loc_luu WHERE id = $1`, [id]);
      else if (loai === "doiTen") {
        const ten = chuanHoaTenBoLoc(hanhDong.ten);
        if (!ten) throw new LoiNguoiDung("Tên bộ lọc không được để trống.");
        await client.query(`UPDATE bo_loc_luu SET ten = $1 WHERE id = $2`, [ten, id]);
      } else if (loai === "capNhat") {
        const dn = chuanHoaDinhNghia(hanhDong.dinhNghia);
        if (!coDieuKienLoc(dn)) throw new LoiNguoiDung("Bộ lọc đang trống — hãy chọn ít nhất một điều kiện.");
        // Doi dieu kien -> lay lai moc (ma_khop = NULL): lan kiem tra sau chi ghi nhan tap ma hien co, KHONG bao ca danh sach nhu "moi".
        await client.query(`UPDATE bo_loc_luu SET dinh_nghia = $1::jsonb, ma_khop = NULL WHERE id = $2`, [JSON.stringify(dn), id]);
      } else if (loai === "baoVeMay") {
        await client.query(`UPDATE bo_loc_luu SET bao_ve_may = $1, ma_khop = NULL WHERE id = $2`, [hanhDong.bat === true, id]);
      } else throw new LoiNguoiDung("Thao tác không hợp lệ.");
    }
    return { danhSach: await docTatCa(client, nguoiDungId), idMoi };
  });
}

const HIEN_TOI_DA = 8;
const NGUONG_DU_LIEU = 100; // it hon the nay = du lieu loi/thieu -> khong so sanh (tranh bao hang loat khi du lieu hoi phuc)

// Goi sau moi lan upload tin hieu (thongBaoPhien). Moi bo loc BAT thong bao: tinh tap ma khop hien tai, so voi tap lan truoc (ma_khop) -> ma MOI khop thi day ve may chu tai khoan do.
// Lan dau (ma_khop NULL) chi ghi nhan moc, khong bao. KHONG throw ra ngoai.
export async function canhBaoBoLocLuu({ tatCa = [], trongPhien = false, gui = true } = {}) {
  try {
    if (tatCa.length < NGUONG_DU_LIEU) return { soBoLoc: 0, boQua: "du lieu thieu" };
    const ds = await withDb(async (client) => {
      await daoDamBangBoLocLuu(client);
      const { rows } = await client.query(
        `SELECT b.id, b.nguoi_dung_id, b.ten, b.dinh_nghia, b.ma_khop
         FROM bo_loc_luu b JOIN nguoi_dung nd ON nd.id = b.nguoi_dung_id
         WHERE b.bao_ve_may = true AND (nd.la_admin OR ${DUOC_XEM})`
      );
      return rows;
    });
    if (!ds.length) return { soBoLoc: 0 };
    const chiBao = await layChiBaoKyThuat().catch(() => null);
    const dong = gopChiBao(tatCa, chiBao);
    const canGui = [];
    const capNhat = [];
    for (const b of ds) {
      const khop = locTheoDinhNghia(dong, b.dinh_nghia, { coNguoiDung: true }).map((r) => r.ma);
      const truoc = new Set(b.ma_khop ?? []);
      const moi = b.ma_khop == null ? [] : khop.filter((m) => !truoc.has(m));
      const doi = b.ma_khop == null || khop.length !== truoc.size || moi.length > 0 || [...truoc].some((m) => !khop.includes(m));
      if (doi) capNhat.push({ id: b.id, khop });
      if (moi.length) canGui.push({ b, moi });
    }
    if (capNhat.length) {
      await withDb(async (client) => {
        for (const c of capNhat) await client.query(`UPDATE bo_loc_luu SET ma_khop = $1::text[] WHERE id = $2`, [c.khop, c.id]);
      });
    }
    let daGui = 0;
    if (gui && canGui.length) {
      const { guiDay } = await import("@/lib/thongBaoDb");
      for (const { b, moi } of canGui) {
        const hien = moi.slice(0, HIEN_TOI_DA).join(", ") + (moi.length > HIEN_TOI_DA ? ` +${moi.length - HIEN_TOI_DA}` : "");
        const kq = await guiDay(
          [
            {
              khoa: `bo_loc:${b.id}:${Date.now()}`,
              loai: "bo_loc",
              tieu_de: `Bộ lọc “${b.ten}”: ${moi.length} mã mới khớp`,
              noi_dung: hien,
              duong_dan: `/bo-loc?loc=${b.id}`,
            },
          ],
          { trongPhien, chiNguoiDungId: b.nguoi_dung_id }
        );
        daGui += kq?.daGui ?? 0;
      }
    }
    return { soBoLoc: ds.length, coMaMoi: canGui.length, daGui };
  } catch (e) {
    return { loi: String(e?.message || e) };
  }
}
