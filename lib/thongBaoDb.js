import webpush from "web-push";
import { withDb, daoDamBangThongBao, daoDamBangThamGia } from "@/lib/db";
import { locChoNguoiDung, tomTatDay, dungThongBaoTinHieu } from "@/lib/thongBao";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layLenhCoSuKienNgay, ngayGiaoDichVN } from "@/lib/lenhDaDong";
import { dungCoHoiHomNay } from "@/lib/coHoiHomNay";
import { capNhatMoiNhat } from "@/components/dungChung";

// DOC / GHI THONG BAO + GUI THONG BAO DAY VE MAY (Web Push) - noi dung thong bao o lib/thongBao.js (ham thuan).
// Thong bao day: trinh duyet (Chrome/Edge/Firefox, Safari tren Mac; iPhone/iPad can them web vao Man hinh chinh) nhan qua may chu day cua hang trinh duyet,
// noi dung duoc ma hoa bang khoa cua tung trinh duyet. Mien phi, khong can dich vu ngoai.

const SO_NGAY_HIEN = 7;
const GIOI_HAN_DS = 60;

// Ghi cac thong bao MOI (khoa da co thi bo qua) - tra ve dung cac dong vua them (de chi gui day nhung su kien lan dau thay).
export async function ghiThongBao(ds) {
  if (!ds?.length) return [];
  return withDb(async (client) => {
    await daoDamBangThongBao(client);
    const { rows } = await client.query(
      `INSERT INTO thong_bao (khoa, loai, chi_admin, ma, tieu_de, noi_dung, duong_dan, ngay)
       SELECT * FROM unnest($1::text[], $2::text[], $3::boolean[], $4::text[], $5::text[], $6::text[], $7::text[], $8::date[])
       ON CONFLICT (khoa) DO NOTHING
       RETURNING id, khoa, loai, chi_admin, ma, tieu_de, noi_dung, duong_dan, tao_luc`,
      [
        ds.map((t) => t.khoa),
        ds.map((t) => t.loai),
        ds.map((t) => t.chi_admin === true),
        ds.map((t) => t.ma ?? null),
        ds.map((t) => t.tieu_de),
        ds.map((t) => t.noi_dung ?? null),
        ds.map((t) => t.duong_dan ?? null),
        ds.map((t) => t.ngay ?? null),
      ]
    );
    return rows;
  });
}

// THONG BAO TIN HIEU CUA PHIEN MOI NHAT tu du lieu dang co trong DB - dung DUNG cach lap 4 o "Top co hoi dang chu y" o trang dau (phien = phien giao dich cua lan cap nhat moi nhat).
// ghi = false: chi xem truoc. gui = true: gui day cac su kien MOI ghi. Goi sau moi lan upload tin hieu (app/api/upload-signals) va tu /api/thong-bao/nap-phien (quan tri).
export async function thongBaoPhien({ ghi = true, gui = true, trongPhien = false } = {}) {
  const tatCa = await layTatCaTinHieu();
  const capNhat = capNhatMoiNhat(tatCa);
  const ngay = capNhat ? ngayGiaoDichVN(new Date(capNhat)) : null;
  const dongLenh = ngay ? await layLenhCoSuKienNgay(ngay) : [];
  const suKien = dungThongBaoTinHieu(dungCoHoiHomNay({ tatCa, dongLenh, ngay }));
  if (!ghi) return { ngay, suKien };
  const moi = await ghiThongBao(suKien);
  const kq = { ngay, soSuKien: suKien.length, moi: moi.length };
  if (gui && moi.length) Object.assign(kq, await guiDay(moi, { trongPhien }));
  return kq;
}

// Danh sach cho chuong thong bao (7 ngay gan nhat, moi nhat truoc) + trang thai cua tai khoan (null = khach chua dang nhap: khong thay thong bao chi quan tri).
export async function layThongBao(nguoiDung) {
  return withDb(async (client) => {
    await daoDamBangThongBao(client);
    const { rows: ds } = await client.query(
      // Moi nhat truoc; cac su kien cua CUNG 1 lan upload (cung tao_luc) giu thu tu ghi: Mua, Ban, Mua moi, Ban bot, Giam bot. ngay = phien giao dich cua su kien (null voi dang ky).
      `SELECT id, loai, ma, tieu_de, noi_dung, duong_dan, tao_luc, to_char(ngay, 'YYYY-MM-DD') AS ngay FROM thong_bao
       WHERE tao_luc > now() - ($1 || ' days')::interval AND (chi_admin = false OR $2::boolean)
       ORDER BY tao_luc DESC, id ASC LIMIT $3`,
      [String(SO_NGAY_HIEN), nguoiDung?.la_admin === true, GIOI_HAN_DS]
    );
    if (!nguoiDung) return { ds, xemLuc: null, phamVi: null };
    const { rows } = await client.query(`SELECT thong_bao_xem_luc, thong_bao_pham_vi FROM nguoi_dung WHERE id = $1`, [nguoiDung.id]);
    return { ds, xemLuc: rows[0]?.thong_bao_xem_luc ?? null, phamVi: rows[0]?.thong_bao_pham_vi ?? "tat_ca" };
  });
}

export async function danhDauDaXem(nguoiDungId) {
  return withDb(async (client) => {
    await daoDamBangThongBao(client);
    await client.query(`UPDATE nguoi_dung SET thong_bao_xem_luc = now() WHERE id = $1`, [nguoiDungId]);
  });
}

export async function datPhamVi(nguoiDungId, phamVi) {
  if (!["tat_ca", "danh_muc", "khong"].includes(phamVi)) throw new Error("Phạm vi không hợp lệ.");
  return withDb(async (client) => {
    await daoDamBangThongBao(client);
    await client.query(`UPDATE nguoi_dung SET thong_bao_pham_vi = $1 WHERE id = $2`, [phamVi, nguoiDungId]);
  });
}

// Cap khoa VAPID cua web: tao 1 lan roi luu (2 yeu cau cung luc lan dau -> ON CONFLICT giu cap tao truoc, ca 2 doc lai cung 1 cap).
async function layCapKhoa(client) {
  await daoDamBangThongBao(client);
  let { rows } = await client.query(`SELECT khoa_cong_khai, khoa_bi_mat FROM cau_hinh_day WHERE id = 1`);
  if (!rows.length) {
    const k = webpush.generateVAPIDKeys();
    await client.query(`INSERT INTO cau_hinh_day (id, khoa_cong_khai, khoa_bi_mat) VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING`, [k.publicKey, k.privateKey]);
    ({ rows } = await client.query(`SELECT khoa_cong_khai, khoa_bi_mat FROM cau_hinh_day WHERE id = 1`));
  }
  return { congKhai: rows[0].khoa_cong_khai, biMat: rows[0].khoa_bi_mat };
}

export async function layKhoaCongKhai() {
  return withDb(async (client) => (await layCapKhoa(client)).congKhai);
}

// Luu / chuyen dang ky day cua 1 trinh duyet sang tai khoan dang dang nhap (cung trinh duyet dang nhap tai khoan khac -> endpoint chuyen chu).
export async function luuDangKyDay(nguoiDungId, sub) {
  const endpoint = String(sub?.endpoint || "");
  const p256dh = String(sub?.keys?.p256dh || "");
  const auth = String(sub?.keys?.auth || "");
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth || endpoint.length > 1000) throw new Error("Đăng ký thông báo không hợp lệ.");
  return withDb(async (client) => {
    await daoDamBangThongBao(client);
    await client.query(
      `INSERT INTO dang_ky_day (nguoi_dung_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET nguoi_dung_id = EXCLUDED.nguoi_dung_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [nguoiDungId, endpoint, p256dh, auth]
    );
  });
}

export async function xoaDangKyDay(nguoiDungId, endpoint) {
  return withDb(async (client) => {
    await daoDamBangThongBao(client);
    await client.query(`DELETE FROM dang_ky_day WHERE endpoint = $1 AND nguoi_dung_id = $2`, [String(endpoint || ""), nguoiDungId]);
  });
}

// Tai khoan nay da bat thong bao ve may tren bao nhieu trinh duyet (hien o chuong thong bao).
export async function demDangKyDay(nguoiDungId) {
  return withDb(async (client) => {
    await daoDamBangThongBao(client);
    const { rows } = await client.query(`SELECT COUNT(*)::int AS dem FROM dang_ky_day WHERE nguoi_dung_id = $1`, [nguoiDungId]);
    return rows[0].dem;
  });
}

// Gui day cho tung trinh duyet da dang ky: moi trinh duyet 1 thong bao gom cac su kien tai khoan do duoc nhan (locChoNguoiDung). chiNguoiDungId: chi gui cho 1 tai khoan (nut "Gui thu").
// Trinh duyet da huy dang ky / het han (404, 410) -> xoa. KHONG throw - loi gui khong duoc lam hong viec goi (upload tin hieu, dang ky).
export async function guiDay(ds, { trongPhien = false, chiNguoiDungId = null } = {}) {
  const kq = { daGui: 0, daXoa: 0 };
  if (!ds?.length) return kq;
  try {
    // Doc khoa + danh sach dang ky roi TRA ket noi DB ngay (gui day co the mat vai giay, khong giu ket noi trong luc cho).
    const { khoa, cacDk } = await withDb(async (client) => {
      const khoa = await layCapKhoa(client);
      await daoDamBangThamGia(client);
      const { rows } = await client.query(
        `SELECT dk.endpoint, dk.p256dh, dk.auth, nd.la_admin, nd.da_duyet, nd.thong_bao_pham_vi,
                COALESCE((SELECT array_agg(tg.ma) FROM tham_gia_ma tg WHERE tg.nguoi_dung_id = nd.id), '{}') AS ma_theo_doi
         FROM dang_ky_day dk JOIN nguoi_dung nd ON nd.id = dk.nguoi_dung_id
         WHERE $1::int IS NULL OR nd.id = $1::int`,
        [chiNguoiDungId]
      );
      return { khoa, cacDk: rows };
    });
    const tuyChon = { vapidDetails: { subject: "https://www.cloudstock.id.vn", publicKey: khoa.congKhai, privateKey: khoa.biMat }, TTL: 6 * 3600, urgency: "high", timeout: 8000 };
    const hetHan = [];
    await Promise.all(
      cacDk.map(async (dk) => {
        const phan = chiNguoiDungId ? ds : locChoNguoiDung(ds, { laAdmin: dk.la_admin, daDuyet: dk.da_duyet, phamVi: dk.thong_bao_pham_vi, maTheoDoi: dk.ma_theo_doi });
        const noiDung = tomTatDay(phan, { trongPhien });
        if (!noiDung) return;
        try {
          await webpush.sendNotification({ endpoint: dk.endpoint, keys: { p256dh: dk.p256dh, auth: dk.auth } }, JSON.stringify(noiDung), tuyChon);
          kq.daGui++;
        } catch (e) {
          if (e?.statusCode === 404 || e?.statusCode === 410) hetHan.push(dk.endpoint);
          else if (!kq.loi) kq.loi = `${e?.statusCode ?? ""} ${String(e?.body || e?.message || e).slice(0, 200)}`.trim();
        }
      })
    );
    if (hetHan.length) {
      await withDb((client) => client.query(`DELETE FROM dang_ky_day WHERE endpoint = ANY($1::text[])`, [hetHan]));
      kq.daXoa = hetHan.length;
    }
    return kq;
  } catch (e) {
    return { ...kq, loi: String(e?.message || e) };
  }
}
