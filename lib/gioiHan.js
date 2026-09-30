import crypto from "crypto";
import { withDb, daoDamBangGioiHan } from "@/lib/db";

// GIOI HAN SO LAN TRUY CAP (chong doan mat khau, spam dang ky / form lien he). Dem trong Postgres (bang gioi_han_truy_cap) vi may chu Vercel la serverless:
// bo nho moi instance tach roi nhau nen dem trong RAM de bi lach. Moi "khoa" (vd "dn:ip:<ma bam>") co 1 cua so thoi gian; het cua so thi dem lai tu 1.
// Thoi gian lay tu dong ho may chu ung dung (truyen vao SQL) de khong phu thuoc ham thoi gian cua DB. LOI DB thi CHO QUA (khong chan nguoi dung that).
// KHOA dung ban BAM cua IP/SDT (khong doc nguoc duoc); de trang quan tri xem "ai dang bi chan" thi luu them IP that / SDT da che bot so vao cot nguon, ip_cuoi - chi o bang nay va tu xoa sau 1 ngay.

// Dia chi mang that cua nguoi goi. Vercel TU GHI DE x-forwarded-for bang IP that cua khach (khach khong gia mao duoc).
export function layIpTho(request) {
  const xff = request.headers.get("x-forwarded-for");
  return ((xff ? xff.split(",")[0] : request.headers.get("x-real-ip") || "").trim() || "khong-ro").slice(0, 64);
}

// Ban BAM cua IP dung lam khoa dem (khong luu IP tho trong khoa).
export function layIp(request) {
  return bamKhoa(`ip:${layIpTho(request)}`);
}

// Bam 1 gia tri nhay cam (vd so dien thoai) truoc khi dung lam khoa, de khoa khong chua so that.
export function bamKhoa(giaTri) {
  return crypto.createHash("sha256").update(`cs-gioi-han:${giaTri}`).digest("hex").slice(0, 20);
}

// 0912345678 -> 0912***678 (chi de hien o trang quan tri)
export const cheSdt = (sdt) => (sdt && sdt.length >= 7 ? `${sdt.slice(0, 4)}***${sdt.slice(-3)}` : "***");

const cuaSoBatDau = (cuaSoGiay, bayGio) => new Date(bayGio.getTime() - cuaSoGiay * 1000);

// Tang bo dem cua `khoa` them 1 va cho biet con duoc phep khong (so lan <= toiDa).
// Tuy chon de trang quan tri hien duoc danh sach bi chan: nhan (loai), nguon (IP that hoac SDT da che), ipTho (IP moi nhat cham vao khoa). Khong truyen nhan thi khong vao danh sach.
export async function choPhep({ khoa, toiDa, cuaSoGiay, nhan = null, nguon = null, ipTho = null }) {
  const bayGio = new Date();
  const cat = cuaSoBatDau(cuaSoGiay, bayGio);
  try {
    const { rows } = await withDb(async (client) => {
      await daoDamBangGioiHan(client);
      // 1% lan goi tien hanh don cac khoa da cu (hon 1 ngay) de bang khong phinh ra.
      if (Math.random() < 0.01) await client.query(`DELETE FROM gioi_han_truy_cap WHERE bat_dau < $1::timestamptz`, [new Date(bayGio.getTime() - 86400e3)]);
      return client.query(
        `INSERT INTO gioi_han_truy_cap (khoa, so_lan, bat_dau, nhan, nguon, ip_cuoi, nguong_chan, cua_so_giay)
         VALUES ($1, 1, $2::timestamptz, $4::text, $5::text, $6::text, $7::integer, $8::integer)
         ON CONFLICT (khoa) DO UPDATE SET
           so_lan = CASE WHEN gioi_han_truy_cap.bat_dau < $3::timestamptz THEN 1 ELSE gioi_han_truy_cap.so_lan + 1 END,
           bat_dau = CASE WHEN gioi_han_truy_cap.bat_dau < $3::timestamptz THEN $2::timestamptz ELSE gioi_han_truy_cap.bat_dau END,
           nhan = COALESCE($4::text, gioi_han_truy_cap.nhan),
           nguon = COALESCE($5::text, gioi_han_truy_cap.nguon),
           ip_cuoi = COALESCE($6::text, gioi_han_truy_cap.ip_cuoi),
           nguong_chan = COALESCE($7::integer, gioi_han_truy_cap.nguong_chan),
           cua_so_giay = COALESCE($8::integer, gioi_han_truy_cap.cua_so_giay)
         RETURNING so_lan, bat_dau`,
        [khoa, bayGio, cat, nhan, nguon, ipTho, nhan ? toiDa + 1 : null, nhan ? cuaSoGiay : null]
      );
    });
    const soLan = Number(rows[0].so_lan);
    const conLaiGiay = Math.max(1, Math.ceil((new Date(rows[0].bat_dau).getTime() + cuaSoGiay * 1000 - bayGio.getTime()) / 1000));
    return { duocPhep: soLan <= toiDa, soLan, thuLaiSau: conLaiGiay };
  } catch (e) {
    console.error("[gioi-han] loi, cho qua:", e?.message || e);
    return { duocPhep: true, soLan: 0, thuLaiSau: 0 };
  }
}

// Xem so lan hien tai cua `khoa` trong cua so (KHONG tang). Khong co / het han -> 0.
export async function dem({ khoa, cuaSoGiay }) {
  try {
    const bayGio = new Date();
    const { rows } = await withDb(async (client) => {
      await daoDamBangGioiHan(client);
      return client.query(`SELECT so_lan, bat_dau FROM gioi_han_truy_cap WHERE khoa = $1 AND bat_dau >= $2::timestamptz`, [khoa, cuaSoBatDau(cuaSoGiay, bayGio)]);
    });
    if (!rows[0]) return { soLan: 0, thuLaiSau: 0 };
    return { soLan: Number(rows[0].so_lan), thuLaiSau: Math.max(1, Math.ceil((new Date(rows[0].bat_dau).getTime() + cuaSoGiay * 1000 - bayGio.getTime()) / 1000)) };
  } catch (e) {
    console.error("[gioi-han] loi, cho qua:", e?.message || e);
    return { soLan: 0, thuLaiSau: 0 };
  }
}

export async function xoaKhoa(khoa) {
  try {
    await withDb(async (client) => {
      await daoDamBangGioiHan(client);
      await client.query(`DELETE FROM gioi_han_truy_cap WHERE khoa = $1`, [khoa]);
    });
  } catch (e) {
    console.error("[gioi-han] loi xoa khoa:", e?.message || e);
  }
}

// HAM THUAN: tu cac dong cua bang chon ra (a) nhung khoa DANG BI CHAN (so lan da cham nguong va cua so chua het) va (b) nhung khoa DANG TIEN GAN nguong (>= 50%).
// Sap giam dan theo so lan. conLaiGiay = con bao lau nua thi het chan / het cua so dem.
export function phanLoaiGioiHan(rows, bayGio = new Date()) {
  const chan = [];
  const canhBao = [];
  for (const r of rows) {
    if (r.nguong_chan == null || r.cua_so_giay == null || !r.nhan) continue;
    const hetHan = new Date(r.bat_dau).getTime() + Number(r.cua_so_giay) * 1000;
    const conLaiGiay = Math.ceil((hetHan - bayGio.getTime()) / 1000);
    if (conLaiGiay <= 0) continue;
    const soLan = Number(r.so_lan);
    const nguong = Number(r.nguong_chan);
    const muc = { khoa: r.khoa, nhan: r.nhan, nguon: r.nguon ?? null, ipCuoi: r.ip_cuoi ?? null, soLan, nguong, conLaiGiay, batDau: r.bat_dau };
    if (soLan >= nguong) chan.push(muc);
    else if (soLan >= nguong * 0.5) canhBao.push(muc);
  }
  const theoSoLan = (a, b) => b.soLan - a.soLan || b.conLaiGiay - a.conLaiGiay;
  return { chan: chan.sort(theoSoLan), canhBao: canhBao.sort(theoSoLan) };
}

export async function layDanhSachChan() {
  const bayGio = new Date();
  const { rows } = await withDb(async (client) => {
    await daoDamBangGioiHan(client);
    return client.query(
      `SELECT khoa, nhan, nguon, ip_cuoi, so_lan, bat_dau, nguong_chan, cua_so_giay FROM gioi_han_truy_cap
       WHERE nhan IS NOT NULL AND bat_dau >= $1::timestamptz ORDER BY so_lan DESC LIMIT 500`,
      [new Date(bayGio.getTime() - 86400e3)]
    );
  });
  return phanLoaiGioiHan(rows, bayGio);
}

// Tra loi 429 (qua nhieu lan) kem Retry-After de trinh duyet/he thong biet khi nao thu lai.
export function traLoiQuaNhieuLan(thuLaiSau, thongBao = "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.") {
  const phut = Math.max(1, Math.ceil(thuLaiSau / 60));
  return Response.json(
    { loi: thongBao.replace("{phut}", String(phut)) },
    { status: 429, headers: { "Retry-After": String(Math.max(1, thuLaiSau)) } }
  );
}
