import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layDanhMucLuu, luuDanhMucLuu, xoaDanhMucLuu } from "@/lib/danhMucLuuDb";
import { thongBaoLoi } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";
export const dynamic = "force-dynamic";

// DANH MUC DA LUU cua tai khoan dang dang nhap (lib/danhMucLuuDb.js). Can dang nhap; chi doc / sua / xoa danh muc cua chinh minh.
//   GET                         -> { ds: [{ id, ten, du_lieu, lich_su_nhan, cap_nhat }] }
//   POST { id?, ten, duLieu }   -> luu (co id = cap nhat, khong co = tao moi) -> { id, cap_nhat }
//   DELETE ?id=                 -> xoa
async function layNguoi(request) {
  return layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
}
const canDangNhap = () => Response.json({ loi: "Cần đăng nhập để lưu danh mục." }, { status: 401 });

export async function GET(request) {
  const nguoiDung = await layNguoi(request);
  if (!nguoiDung) return canDangNhap();
  try {
    return Response.json({ ds: await layDanhMucLuu(nguoiDung.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 500 });
  }
}

export async function POST(request) {
  const nguoiDung = await layNguoi(request);
  if (!nguoiDung) return canDangNhap();
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  try {
    return Response.json(await luuDanhMucLuu(nguoiDung, { id: body?.id ?? null, ten: body?.ten, duLieu: body?.duLieu }));
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 400 });
  }
}

export async function DELETE(request) {
  const nguoiDung = await layNguoi(request);
  if (!nguoiDung) return canDangNhap();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!(id > 0)) return Response.json({ loi: "Thiếu mã danh mục." }, { status: 400 });
  try {
    await xoaDanhMucLuu(nguoiDung.id, id);
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 400 });
  }
}
