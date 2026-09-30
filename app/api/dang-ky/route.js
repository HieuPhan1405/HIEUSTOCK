import { after } from "next/server";
import { dangKy } from "@/lib/nguoiDung";
import { thongBaoDangKy } from "@/lib/thongBao";
import { ghiThongBao, guiDay } from "@/lib/thongBaoDb";
import { guiTinNhanZalo } from "@/lib/zalo";
import { choPhep, dem, layIp, traLoiQuaNhieuLan } from "@/lib/gioiHan";
import { LoiNguoiDung, thongBaoLoi } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";
const SO_NGAY_PHIEN = 30;

// CHONG SPAM DANG KY: (1) o bay "website" an (nguoi that khong thay -> khong dien; bot hay dien het moi o); (2) moi dia chi mang toi da 8 lan thu / gio;
// (3) ca he thong toi da 100 tai khoan THANH CONG / gio (chi dem khi thanh cong de spam vo nghia khong lam het suat cua nguoi that); (4) bao chu web chi 3 nguoi / 10 phut
// (con lai xem o /quan-tri) de khong bi ngap Zalo + thong bao ve may.
const CUA_SO_GIO = 3600;
const TOI_DA_MOI_IP = 8;
const TOI_DA_TOAN_HE_THONG = 100;

function dongYCookie(token) {
  const maxAge = SO_NGAY_PHIEN * 24 * 60 * 60;
  const cac = [`${TEN_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (process.env.NODE_ENV === "production") cac.push("Secure");
  return cac.join("; ");
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }

  if (body?.website) return Response.json({ loi: "Không thể đăng ký lúc này, vui lòng thử lại sau." }, { status: 400 });

  const gIp = await choPhep({ khoa: `dk:ip:${layIp(request)}`, toiDa: TOI_DA_MOI_IP, cuaSoGiay: CUA_SO_GIO });
  if (!gIp.duocPhep) return traLoiQuaNhieuLan(gIp.thuLaiSau, "Bạn đã thử đăng ký quá nhiều lần. Vui lòng thử lại sau khoảng {phut} phút.");
  const tong = await dem({ khoa: "dk:toan-he-thong", cuaSoGiay: CUA_SO_GIO });
  if (tong.soLan >= TOI_DA_TOAN_HE_THONG) {
    return traLoiQuaNhieuLan(tong.thuLaiSau, "Hệ thống đang nhận quá nhiều đăng ký cùng lúc. Vui lòng thử lại sau khoảng {phut} phút, hoặc nhắn qua Zalo để được hỗ trợ.");
  }

  try {
    const { token, nguoiDung } = await dangKy({
      sdt: body?.sdt,
      email: body?.email,
      matKhau: body?.matKhau,
      matKhau2: body?.matKhau2,
      ten: body?.ten,
    });
    await choPhep({ khoa: "dk:toan-he-thong", toiDa: TOI_DA_TOAN_HE_THONG, cuaSoGiay: CUA_SO_GIO });
    // Bao QUAN TRI co nguoi dang ky moi (chuong thong bao + thong bao ve may + Zalo cua chu web) - chay SAU khi tra ket qua, loi o day khong anh huong nguoi dang ky.
    after(async () => {
      try {
        const tb = await choPhep({ khoa: "dk:thong-bao", toiDa: 3, cuaSoGiay: 600 });
        if (!tb.duocPhep) return; // dang co nhieu dang ky don dap: khong bao tung nguoi nua, xem day du o /quan-tri
        const moi = await ghiThongBao([thongBaoDangKy(nguoiDung)]);
        if (moi.length) await guiDay(moi);
        const them = tb.soLan >= 3 ? "\n⚠ Đang có nhiều đăng ký liên tiếp, các tin sau sẽ không báo lẻ — xem đủ ở /quan-tri." : "";
        await guiTinNhanZalo(`👤 NGƯỜI MỚI ĐĂNG KÝ: ${nguoiDung.ten || "Chưa đặt tên"} · ${nguoiDung.sdt} · ${nguoiDung.email}\nĐang chờ duyệt: https://cloudstock.id.vn/quan-tri${them}`);
      } catch {
        /* bo qua */
      }
    });
    return Response.json({ trangThai: "ok", nguoiDung }, { headers: { "Set-Cookie": dongYCookie(token) } });
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: loi instanceof LoiNguoiDung ? 400 : 500 });
  }
}
