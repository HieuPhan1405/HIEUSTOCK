import { dangNhap } from "@/lib/nguoiDung";

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
    const { token, nguoiDung } = await dangNhap({ sdt: body?.sdt, matKhau: body?.matKhau });
    return Response.json(
      { trangThai: "ok", nguoiDung },
      { headers: { "Set-Cookie": dongYCookie(token) } }
    );
  } catch (loi) {
    return Response.json({ loi: String(loi?.message || loi) }, { status: 400 });
  }
}
