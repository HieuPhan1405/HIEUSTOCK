import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { withDb, daoDamBangNguoiDung, daoDamBangThongBao, daoDamBangThamGia } from "@/lib/db";
import { LoiNguoiDung } from "@/lib/loiAnToan";
import { kiemTraTen, chuanHoaEmail, kiemTraMatKhau } from "@/lib/kiemTraDangKy";

const TEN_COOKIE = "cs_token";

const SO_NGAY_PHIEN = 30;

// Chuan hoa SDT ve dang "0xxxxxxxxx" (10 so, khong dau +84/84) de tranh
// trung lap tai khoan chi vi go khac dinh dang (vd "+84912345678" va
// "0912345678" phai duoc coi la CUNG 1 so).
export function chuanHoaSdt(input) {
  const so = String(input || "").replace(/[^\d+]/g, "");
  let sdt = so;
  if (sdt.startsWith("+84")) sdt = "0" + sdt.slice(3);
  else if (sdt.startsWith("84") && sdt.length === 11) sdt = "0" + sdt.slice(2);
  if (!/^0\d{9}$/.test(sdt)) return null;
  return sdt;
}

async function taoPhien(client, nguoiDungId) {
  const token = crypto.randomBytes(32).toString("hex");
  const hetHan = new Date(Date.now() + SO_NGAY_PHIEN * 24 * 60 * 60 * 1000);
  await client.query(`INSERT INTO phien_dang_nhap (token, nguoi_dung_id, het_han) VALUES ($1, $2, $3)`, [
    token,
    nguoiDungId,
    hetHan,
  ]);
  return { token, hetHan };
}

// DUNG THU (11/11/2026): tai khoan moi duoc xem noi dung thanh vien SO_NGAY_DUNG_THU ngay ngay sau khi dang ky (cot dung_thu_den), khong phai cho duyet.
// Moi noi kiem tra quyen deu doc nguoiDung.da_duyet tu cac ham duoi -> da_duyet tra ra = da duyet that HOAC con han dung thu. Dat 0 de tat dung thu.
export const SO_NGAY_DUNG_THU = 7;
const DUOC_XEM = "(nd.da_duyet OR (nd.dung_thu_den IS NOT NULL AND nd.dung_thu_den > now()))";

// Tai khoan MOI dang ky mac dinh da_duyet = false (can admin bam "Duyet" o /quan-tri) - xem chu
// thich tai cot da_duyet trong lib/db.js. Van tao phien dang nhap ngay (khong chan dang nhap) de
// nguoi dung thay duoc trang thai "dang cho duyet" thay vi tuong dang ky that bai.
export async function dangKy({ sdt, email, matKhau, matKhau2, ten }) {
  const tenSach = String(ten ?? "").trim();
  const loiTen = kiemTraTen(tenSach);
  if (loiTen) throw new LoiNguoiDung(loiTen);
  const sdtChuan = chuanHoaSdt(sdt);
  if (!sdtChuan) throw new LoiNguoiDung("Số điện thoại không hợp lệ (10 số, ví dụ 0912345678).");
  const emailChuan = chuanHoaEmail(email);
  if (!emailChuan) throw new LoiNguoiDung("Gmail/email chưa đúng định dạng (ví dụ: ten@gmail.com).");
  const loiMk = kiemTraMatKhau(matKhau, { sdt: sdtChuan, email: emailChuan });
  if (loiMk) throw new LoiNguoiDung(loiMk);
  if (matKhau !== matKhau2) throw new LoiNguoiDung("Mật khẩu nhập lại chưa khớp.");

  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows: trung } = await client.query(`SELECT sdt, lower(email) AS email FROM nguoi_dung WHERE sdt = $1 OR lower(email) = $2`, [sdtChuan, emailChuan]);
    if (trung.some((r) => r.sdt === sdtChuan)) throw new LoiNguoiDung("Số điện thoại này đã đăng ký — vui lòng đăng nhập.");
    if (trung.length > 0) throw new LoiNguoiDung("Gmail này đã được dùng cho một tài khoản khác.");

    const hash = await bcrypt.hash(matKhau, 10);
    let rows;
    try {
      ({ rows } = await client.query(
        `INSERT INTO nguoi_dung AS nd (sdt, email, mat_khau_hash, ten, da_duyet, dung_thu_den) VALUES ($1, $2, $3, $4, false, CASE WHEN $5::int > 0 THEN now() + make_interval(days => $5::int) END)
         RETURNING id, sdt, email, ten, la_admin, ${DUOC_XEM} AS da_duyet, dung_thu_den`,
        [sdtChuan, emailChuan, hash, tenSach, SO_NGAY_DUNG_THU]
      ));
    } catch (e) {
      // 2 nguoi dang ky CUNG LUC cung so/email: rang buoc UNIQUE trong DB chan nguoi den sau - bao loi than thien thay vi loi may chu.
      if (e?.code === "23505") throw new LoiNguoiDung(String(e?.constraint ?? "").includes("email") ? "Gmail này đã được dùng cho một tài khoản khác." : "Số điện thoại này đã đăng ký — vui lòng đăng nhập.");
      throw e;
    }
    const nguoiDung = rows[0];
    const { token, hetHan } = await taoPhien(client, nguoiDung.id);
    return { token, hetHan, nguoiDung };
  });
}

// Bam gia dung de dang nhap SDT khong ton tai van ton dung thoi gian tinh bam nhu SDT co that (khong cho ke xau doan SDT nao da dang ky qua do tre phan hoi).
let bamGia = null;
async function layBamGia() {
  if (!bamGia) bamGia = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
  return bamGia;
}

// Sai SDT hay sai mat khau deu bao CUNG 1 cau (khong cho biet SDT nao da dang ky). loai: "sai" de route dem so lan sai (lib/gioiHan.js).
export async function dangNhap({ sdt, matKhau }) {
  const sdtChuan = chuanHoaSdt(sdt);
  if (!sdtChuan || !matKhau) throw new LoiNguoiDung("Cần nhập đủ số điện thoại và mật khẩu.");
  if (String(matKhau).length > 200) throw new LoiNguoiDung("Số điện thoại hoặc mật khẩu không đúng.", { loai: "sai" });

  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(`SELECT nd.id, nd.sdt, nd.ten, nd.la_admin, ${DUOC_XEM} AS da_duyet, nd.dung_thu_den, nd.mat_khau_hash FROM nguoi_dung nd WHERE nd.sdt = $1`, [sdtChuan]);
    const row = rows[0];
    const dung = await bcrypt.compare(matKhau, row ? row.mat_khau_hash : await layBamGia());
    if (!row || !dung) throw new LoiNguoiDung("Số điện thoại hoặc mật khẩu không đúng.", { loai: "sai" });

    const { token, hetHan } = await taoPhien(client, row.id);
    return { token, hetHan, nguoiDung: { id: row.id, sdt: row.sdt, ten: row.ten, la_admin: row.la_admin, da_duyet: row.da_duyet, dung_thu_den: row.dung_thu_den } };
  });
}

export async function layNguoiDungTuToken(token) {
  if (!token) return null;
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(
      `SELECT nd.id, nd.sdt, nd.ten, nd.la_admin, ${DUOC_XEM} AS da_duyet, nd.da_duyet AS da_duyet_that, nd.dung_thu_den FROM phien_dang_nhap pd
       JOIN nguoi_dung nd ON nd.id = pd.nguoi_dung_id
       WHERE pd.token = $1 AND pd.het_han > now()`,
      [token]
    );
    return rows[0] || null;
  });
}

// Dung TU SERVER COMPONENT (vd cac trang can khoa hoan toan) - doc thang
// cookie tu next/headers, khong can qua fetch/API rieng.
export async function layNguoiDungHienTai() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEN_COOKIE)?.value;
  return layNguoiDungTuToken(token);
}

export async function dangXuat(token) {
  if (!token) return;
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    await client.query(`DELETE FROM phien_dang_nhap WHERE token = $1`, [token]);
  });
}

// Nguoi dung tu doi ten hien thi (nut Tai khoan tren Sidebar) - chi doi ten
// CUA CHINH MINH, nguoiDungId lay tu session (token cookie), khong nhan id
// tu client de tranh doi ten nguoi khac.
export async function capNhatTen(nguoiDungId, tenMoi) {
  const sach = String(tenMoi || "").trim().slice(0, 200);
  if (!sach) throw new Error("Tên không được để trống.");
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(`UPDATE nguoi_dung AS nd SET ten = $1 WHERE nd.id = $2 RETURNING nd.id, nd.sdt, nd.ten, nd.la_admin, ${DUOC_XEM} AS da_duyet, nd.dung_thu_den`, [sach, nguoiDungId]);
    return rows[0] || null;
  });
}

// HO SO CA NHAN (trang /tai-khoan): thong tin tai khoan + so ma dang theo doi + so thiet bi nhan thong bao + cai dat thong bao. Chi doc chinh tai khoan nguoiDungId (lay tu phien, khong nhan id tu client).
export async function layHoSo(nguoiDungId) {
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    await daoDamBangThongBao(client);
    await daoDamBangThamGia(client);
    const { rows } = await client.query(
      `SELECT nd.sdt, nd.email, nd.ten, nd.la_admin, ${DUOC_XEM} AS da_duyet, nd.da_duyet AS da_duyet_that, nd.dung_thu_den, to_char(nd.tao_luc AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS tao_luc,
              nd.thong_bao_pham_vi, nd.thong_bao_nhom,
              (SELECT COUNT(*)::int FROM tham_gia_ma tg WHERE tg.nguoi_dung_id = nd.id) AS so_ma,
              (SELECT COUNT(*)::int FROM dang_ky_day dk WHERE dk.nguoi_dung_id = nd.id) AS so_may
       FROM nguoi_dung nd WHERE nd.id = $1`,
      [nguoiDungId]
    );
    const r = rows[0];
    if (!r) return null;
    return { sdt: r.sdt, email: r.email, ten: r.ten, laAdmin: r.la_admin === true, daDuyet: r.da_duyet === true, dungThuDen: r.da_duyet_that ? null : r.dung_thu_den ?? null, taoLuc: r.tao_luc, phamVi: r.thong_bao_pham_vi ?? "tat_ca", nhom: r.thong_bao_nhom ?? null, soMa: r.so_ma, soMay: r.so_may };
  });
}

// Chi dung tu trang /quan-tri (co API key) de xem danh sach SDT da thu thap.
export async function layTatCaNguoiDung() {
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(
      `SELECT id, sdt, email, ten, la_admin, da_duyet, tao_luc FROM nguoi_dung ORDER BY tao_luc DESC LIMIT 500`
    );
    return rows;
  });
}

// Chi dung tu trang /quan-tri (co API key) - dat/bo quyen Admin cho 1 tai
// khoan SDT. "Admin" o day CHI la 1 the hien thi canh ten (badge) sau khi
// dang nhap, KHONG lien quan gi den mat khau API key rieng cua /quan-tri.
export async function datLaAdmin(id, laAdmin) {
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    await client.query(`UPDATE nguoi_dung SET la_admin = $1 WHERE id = $2`, [laAdmin, id]);
  });
}

// Chi dung tu trang /quan-tri (co API key) - duyet/bo duyet 1 tai khoan. Tai
// khoan CHUA duyet van dang nhap duoc (thay ten/dang xuat binh thuong) nhung
// bi chan o cac trang can dang nhap (xem KhoaTrangNoiDung tai cac trang do).
export async function datDaDuyet(id, daDuyet) {
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    await client.query(`UPDATE nguoi_dung SET da_duyet = $1 WHERE id = $2`, [daDuyet, id]);
  });
}

// Chi dung tu trang /quan-tri (co API key): DAT LAI MAT KHAU cho khach quen. Mat khau cu khong xem duoc (luu bam bcrypt mot chieu) nen tao MAT KHAU TAM ngau nhien
// (10 ky tu chu + so, bo ky tu de nham 0/O 1/l/I), luu bam, xoa moi phien dang nhap dang mo cua tai khoan do. Tra ve mat khau tam de admin gui cho khach - chi hien 1 lan.
export async function datLaiMatKhau(id) {
  const bang = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const so = "23456789";
  const chon = (s) => s[crypto.randomInt(s.length)];
  let mk = chon(bang) + chon(so);
  const tatCa = bang + so;
  while (mk.length < 10) mk += chon(tatCa);
  mk = mk.split("").sort(() => crypto.randomInt(3) - 1).join("");
  if (!/[A-Za-z]/.test(mk) || !/\d/.test(mk)) return datLaiMatKhau(id);
  const hash = await bcrypt.hash(mk, 10);
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(`UPDATE nguoi_dung SET mat_khau_hash = $1 WHERE id = $2 RETURNING sdt, ten`, [hash, id]);
    if (!rows[0]) throw new LoiNguoiDung("Không tìm thấy tài khoản.");
    await client.query(`DELETE FROM phien_dang_nhap WHERE nguoi_dung_id = $1`, [id]);
    return { matKhauTam: mk, sdt: rows[0].sdt, ten: rows[0].ten };
  });
}

// Nguoi dung DA DANG NHAP tu doi mat khau cua minh (menu Tai khoan): can mat khau hien tai (mat khau tam do admin cap cung duoc). Doi xong dang xuat cac phien KHAC (giu phien hien tai).
export async function doiMatKhau(nguoiDungId, matKhauCu, matKhauMoi, tokenHienTai) {
  const loiMk = kiemTraMatKhau(matKhauMoi);
  if (loiMk) throw new LoiNguoiDung(loiMk);
  if (String(matKhauCu || "").length > 200) throw new LoiNguoiDung("Mật khẩu hiện tại chưa đúng.");
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(`SELECT mat_khau_hash FROM nguoi_dung WHERE id = $1`, [nguoiDungId]);
    if (!rows[0] || !(await bcrypt.compare(String(matKhauCu || ""), rows[0].mat_khau_hash))) throw new LoiNguoiDung("Mật khẩu hiện tại chưa đúng.");
    if (matKhauCu === matKhauMoi) throw new LoiNguoiDung("Mật khẩu mới cần khác mật khẩu hiện tại.");
    const hash = await bcrypt.hash(matKhauMoi, 10);
    await client.query(`UPDATE nguoi_dung SET mat_khau_hash = $1 WHERE id = $2`, [hash, nguoiDungId]);
    await client.query(`DELETE FROM phien_dang_nhap WHERE nguoi_dung_id = $1 AND token <> $2`, [nguoiDungId, tokenHienTai || ""]);
  });
}
