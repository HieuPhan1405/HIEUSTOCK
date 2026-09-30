import { dangNhap, chuanHoaSdt } from "@/lib/nguoiDung";
import { choPhep, dem, xoaKhoa, layIp, layIpTho, bamKhoa, cheSdt, traLoiQuaNhieuLan } from "@/lib/gioiHan";
import { LoiNguoiDung, thongBaoLoi } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";
const SO_NGAY_PHIEN = 30;
const CUA_SO_GIAY = 15 * 60; // 15 phut
const TOI_DA_MOI_IP = 30; // so lan thu dang nhap tu 1 dia chi mang trong 15 phut
const TOI_DA_SAI_MOI_SDT = 10; // so lan NHAP SAI cho 1 so dien thoai trong 15 phut (du tu bao nhieu dia chi) - chan doan mat khau phan tan

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

  const ipTho = layIpTho(request);
  const gIp = await choPhep({ khoa: `dn:ip:${layIp(request)}`, toiDa: TOI_DA_MOI_IP, cuaSoGiay: CUA_SO_GIAY, nhan: "Đăng nhập (theo IP)", nguon: ipTho, ipTho });
  if (!gIp.duocPhep) return traLoiQuaNhieuLan(gIp.thuLaiSau, "Bạn thử đăng nhập quá nhiều lần. Vui lòng thử lại sau khoảng {phut} phút.");

  const sdtChuan = chuanHoaSdt(body?.sdt);
  const khoaSdt = sdtChuan ? `dn:sdt:${bamKhoa(sdtChuan)}` : null;
  if (khoaSdt) {
    const d = await dem({ khoa: khoaSdt, cuaSoGiay: CUA_SO_GIAY });
    if (d.soLan >= TOI_DA_SAI_MOI_SDT) return traLoiQuaNhieuLan(d.thuLaiSau, "Nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau khoảng {phut} phút.");
  }

  try {
    const { token, nguoiDung } = await dangNhap({ sdt: body?.sdt, matKhau: body?.matKhau });
    if (khoaSdt) await xoaKhoa(khoaSdt);
    return Response.json({ trangThai: "ok", nguoiDung }, { headers: { "Set-Cookie": dongYCookie(token) } });
  } catch (loi) {
    if (loi?.loai === "sai" && khoaSdt) await choPhep({ khoa: khoaSdt, toiDa: TOI_DA_SAI_MOI_SDT - 1, cuaSoGiay: CUA_SO_GIAY, nhan: "Sai mật khẩu (theo SĐT)", nguon: cheSdt(sdtChuan), ipTho });
    return Response.json({ loi: thongBaoLoi(loi) }, { status: loi instanceof LoiNguoiDung ? 400 : 500 });
  }
}
