import crypto from "crypto";
import bcrypt from "bcryptjs";
import { withDb, daoDamBangNguoiDung } from "@/lib/db";

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

export async function dangKy({ sdt, matKhau, ten }) {
  const sdtChuan = chuanHoaSdt(sdt);
  if (!sdtChuan) throw new Error("Số điện thoại không hợp lệ.");
  if (!matKhau || matKhau.length < 6) throw new Error("Mật khẩu cần ít nhất 6 ký tự.");

  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows: trung } = await client.query(`SELECT id FROM nguoi_dung WHERE sdt = $1`, [sdtChuan]);
    if (trung.length > 0) throw new Error("Số điện thoại này đã đăng ký — vui lòng đăng nhập.");

    const hash = await bcrypt.hash(matKhau, 10);
    const { rows } = await client.query(
      `INSERT INTO nguoi_dung (sdt, mat_khau_hash, ten) VALUES ($1, $2, $3) RETURNING id, sdt, ten`,
      [sdtChuan, hash, (ten || "").trim().slice(0, 200) || null]
    );
    const nguoiDung = rows[0];
    const { token, hetHan } = await taoPhien(client, nguoiDung.id);
    return { token, hetHan, nguoiDung };
  });
}

export async function dangNhap({ sdt, matKhau }) {
  const sdtChuan = chuanHoaSdt(sdt);
  if (!sdtChuan || !matKhau) throw new Error("Cần nhập đủ số điện thoại và mật khẩu.");

  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(`SELECT id, sdt, ten, mat_khau_hash FROM nguoi_dung WHERE sdt = $1`, [
      sdtChuan,
    ]);
    const row = rows[0];
    if (!row) throw new Error("Số điện thoại chưa đăng ký.");
    const dung = await bcrypt.compare(matKhau, row.mat_khau_hash);
    if (!dung) throw new Error("Mật khẩu không đúng.");

    const { token, hetHan } = await taoPhien(client, row.id);
    return { token, hetHan, nguoiDung: { id: row.id, sdt: row.sdt, ten: row.ten } };
  });
}

export async function layNguoiDungTuToken(token) {
  if (!token) return null;
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(
      `SELECT nd.id, nd.sdt, nd.ten FROM phien_dang_nhap pd
       JOIN nguoi_dung nd ON nd.id = pd.nguoi_dung_id
       WHERE pd.token = $1 AND pd.het_han > now()`,
      [token]
    );
    return rows[0] || null;
  });
}

export async function dangXuat(token) {
  if (!token) return;
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    await client.query(`DELETE FROM phien_dang_nhap WHERE token = $1`, [token]);
  });
}

// Chi dung tu trang /quan-tri (co API key) de xem danh sach SDT da thu thap.
export async function layTatCaNguoiDung() {
  return withDb(async (client) => {
    await daoDamBangNguoiDung(client);
    const { rows } = await client.query(`SELECT id, sdt, ten, tao_luc FROM nguoi_dung ORDER BY tao_luc DESC LIMIT 500`);
    return rows;
  });
}
