import crypto from "crypto";
import { withDb, daoDamBangGioiHan } from "@/lib/db";

// GIOI HAN SO LAN TRUY CAP (chong doan mat khau, spam dang ky / form lien he). Dem trong Postgres (bang gioi_han_truy_cap) vi may chu Vercel la serverless:
// bo nho moi instance tach roi nhau nen dem trong RAM de bi lach. Moi "khoa" (vd "dn:ip:<ma bam>") co 1 cua so thoi gian; het cua so thi dem lai tu 1.
// Thoi gian lay tu dong ho may chu ung dung (truyen vao SQL) de khong phu thuoc ham thoi gian cua DB. LOI DB thi CHO QUA (khong chan nguoi dung that).

// Dia chi mang cua nguoi goi. Vercel TU GHI DE x-forwarded-for bang IP that cua khach (khach khong gia mao duoc). Luu ban BAM, khong luu IP tho.
export function layIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  const ip = (xff ? xff.split(",")[0] : request.headers.get("x-real-ip") || "").trim() || "khong-ro";
  return crypto.createHash("sha256").update(`cs-gioi-han:${ip}`).digest("hex").slice(0, 20);
}

// Bam 1 gia tri nhay cam (vd so dien thoai) truoc khi dung lam khoa, de bang gioi han khong chua so that.
export const bamKhoa = (giaTri) => crypto.createHash("sha256").update(`cs-gioi-han:${giaTri}`).digest("hex").slice(0, 20);

const cuaSoBatDau = (cuaSoGiay, bayGio) => new Date(bayGio.getTime() - cuaSoGiay * 1000);

// Tang bo dem cua `khoa` them 1 va cho biet con duoc phep khong (so lan <= toiDa).
export async function choPhep({ khoa, toiDa, cuaSoGiay }) {
  const bayGio = new Date();
  const cat = cuaSoBatDau(cuaSoGiay, bayGio);
  try {
    const { rows } = await withDb(async (client) => {
      await daoDamBangGioiHan(client);
      // 1% lan goi tien hanh don cac khoa da cu (hon 1 ngay) de bang khong phinh ra.
      if (Math.random() < 0.01) await client.query(`DELETE FROM gioi_han_truy_cap WHERE bat_dau < $1::timestamptz`, [new Date(bayGio.getTime() - 86400e3)]);
      return client.query(
        `INSERT INTO gioi_han_truy_cap (khoa, so_lan, bat_dau) VALUES ($1, 1, $2::timestamptz)
         ON CONFLICT (khoa) DO UPDATE SET
           so_lan = CASE WHEN gioi_han_truy_cap.bat_dau < $3::timestamptz THEN 1 ELSE gioi_han_truy_cap.so_lan + 1 END,
           bat_dau = CASE WHEN gioi_han_truy_cap.bat_dau < $3::timestamptz THEN $2::timestamptz ELSE gioi_han_truy_cap.bat_dau END
         RETURNING so_lan, bat_dau`,
        [khoa, bayGio, cat]
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

// Tra loi 429 (qua nhieu lan) kem Retry-After de trinh duyet/he thong biet khi nao thu lai.
export function traLoiQuaNhieuLan(thuLaiSau, thongBao = "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.") {
  const phut = Math.max(1, Math.ceil(thuLaiSau / 60));
  return Response.json(
    { loi: thongBao.replace("{phut}", String(phut)) },
    { status: 429, headers: { "Retry-After": String(Math.max(1, thuLaiSau)) } }
  );
}
