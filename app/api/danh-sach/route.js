import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layDanhSachCuaToi, xuLyDanhSach } from "@/lib/danhSachTheoDoi";
import { thongBaoLoi, LoiNguoiDung } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";

// GET: cac danh sach theo doi cua tai khoan dang dang nhap (danhSach = null neu chua dang nhap - nut theo doi se mo hop dang nhap).
export async function GET(request) {
  const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
  if (!nguoiDung) return Response.json({ danhSach: null });
  try {
    return Response.json({ danhSach: await layDanhSachCuaToi(nguoiDung.id) });
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: 500 });
  }
}

// POST { loai: "tao" | "doiTen" | "xoa" | "them" | "bo", id, ten, ma } - BAT BUOC dang nhap. Xem lib/danhSachTheoDoi.js.
export async function POST(request) {
  const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
  if (!nguoiDung) return Response.json({ loi: "Cần đăng nhập để lưu danh sách theo dõi." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  try {
    return Response.json(await xuLyDanhSach(nguoiDung.id, body));
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: e instanceof LoiNguoiDung ? 400 : 500 });
  }
}
