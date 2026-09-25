import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layHieuQuaHeThong } from "@/lib/hieuQuaDauTu";

const TEN_COOKIE = "cs_token";

// Ty suat sinh loi cua he thong (lenh da dong + dang mo) so voi VN-Index theo thoi gian: GET /api/hieu-qua-he-thong
// Chi cho nguoi dung DA DANG NHAP va DA DUOC DUYET (lenh dang mo/da dong la noi dung dang nhap moi xem duoc). Lan dau sau khi khoi dong lau (chua co cache
// gia theo ngay) co the mat vai giay vi phai lay gia tung ngay - cho phep toi da 60 giay.
export const maxDuration = 60;

export async function GET(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  if (!nguoiDung) return Response.json({ trangThai: "loi", thongBao: "Chưa đăng nhập." }, { status: 401 });
  if (!nguoiDung.da_duyet) return Response.json({ trangThai: "loi", thongBao: "Tài khoản đang chờ duyệt." }, { status: 403 });
  try {
    const kq = await layHieuQuaHeThong();
    return Response.json({ trangThai: "ok", ...kq }, { headers: { "Cache-Control": "private, max-age=120" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 502 });
  }
}
