import { after } from "next/server";
import { dangKy } from "@/lib/nguoiDung";
import { thongBaoDangKy } from "@/lib/thongBao";
import { ghiThongBao, guiDay } from "@/lib/thongBaoDb";
import { guiTinNhanZalo } from "@/lib/zalo";

const TEN_COOKIE = "cs_token";
const SO_NGAY_PHIEN = 30;

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

  try {
    const { token, nguoiDung } = await dangKy({
      sdt: body?.sdt,
      matKhau: body?.matKhau,
      ten: body?.ten,
    });
    // Bao QUAN TRI co nguoi dang ky moi (chuong thong bao + thong bao ve may + Zalo cua chu web) - chay SAU khi tra ket qua, loi o day khong anh huong nguoi dang ky.
    after(async () => {
      try {
        const moi = await ghiThongBao([thongBaoDangKy(nguoiDung)]);
        if (moi.length) await guiDay(moi);
        await guiTinNhanZalo(`👤 NGƯỜI MỚI ĐĂNG KÝ: ${nguoiDung.ten || "Chưa đặt tên"} · ${nguoiDung.sdt}\nĐang chờ duyệt: https://cloudstock.id.vn/quan-tri`);
      } catch {
        /* bo qua */
      }
    });
    return Response.json(
      { trangThai: "ok", nguoiDung },
      { headers: { "Set-Cookie": dongYCookie(token) } }
    );
  } catch (loi) {
    return Response.json({ loi: String(loi?.message || loi) }, { status: 400 });
  }
}
