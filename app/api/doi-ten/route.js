import { layNguoiDungTuToken, capNhatTen } from "@/lib/nguoiDung";

const TEN_COOKIE = "cs_token";

// Nguoi dung DA DANG NHAP tu doi ten hien thi cua chinh minh (nut Tai khoan).
// Auth qua cookie session (khong nhan id tu body) de khong the doi ten nguoi khac.
export async function POST(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  if (!nguoiDung) return Response.json({ loi: "Chưa đăng nhập." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ten = String(body?.ten || "").trim();
  if (!ten) return Response.json({ loi: "Tên không được để trống." }, { status: 400 });
  if (ten.length > 200) return Response.json({ loi: "Tên quá dài." }, { status: 400 });

  try {
    const capNhat = await capNhatTen(nguoiDung.id, ten);
    return Response.json({ trangThai: "ok", nguoiDung: capNhat });
  } catch (loi) {
    return Response.json({ loi: String(loi?.message || loi) }, { status: 500 });
  }
}
