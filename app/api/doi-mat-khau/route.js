import { layNguoiDungTuToken, doiMatKhau } from "@/lib/nguoiDung";
import { thongBaoLoi } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";

// POST { cu, moi }: nguoi dung DA DANG NHAP tu doi mat khau (xac thuc bang cookie phien, khong nhan id tu body).
export async function POST(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  if (!nguoiDung) return Response.json({ loi: "Chưa đăng nhập." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    await doiMatKhau(nguoiDung.id, String(body?.cu ?? ""), String(body?.moi ?? ""), token);
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 400 });
  }
}
