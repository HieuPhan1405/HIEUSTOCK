import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layBoLocCuaToi, xuLyBoLoc } from "@/lib/boLocLuuDb";
import { thongBaoLoi, LoiNguoiDung } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";
export const dynamic = "force-dynamic";

const duocDung = (nd) => nd && (nd.da_duyet === true || nd.la_admin === true);

// GET: cac bo loc da luu cua tai khoan dang nhap (danhSach = null neu chua dang nhap / chua duoc dung).
export async function GET(request) {
  const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
  if (!duocDung(nguoiDung)) return Response.json({ danhSach: null });
  try {
    return Response.json({ danhSach: await layBoLocCuaToi(nguoiDung.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: 500 });
  }
}

// POST { loai: "tao" | "capNhat" | "doiTen" | "xoa" | "baoVeMay", id, ten, dinhNghia, bat } - BAT BUOC dang nhap (dung thu hoac da duyet). Xem lib/boLocLuuDb.js.
export async function POST(request) {
  const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
  if (!duocDung(nguoiDung)) return Response.json({ loi: "Cần đăng nhập để lưu bộ lọc." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  try {
    return Response.json(await xuLyBoLoc(nguoiDung.id, body));
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: e instanceof LoiNguoiDung ? 400 : 500 });
  }
}
