import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { datMuaThem } from "@/lib/muaThem";
import { MA_HOP_LE } from "@/lib/lichSuGia";

const TEN_COOKIE = "cs_token";

// POST: nguoi dung DA DANG NHAP + DA DUOC DUYET tick/bo tick "da mua dot dau" cho 1 diem mua moi cua chinh minh.
// Body: { ma, vong: "moi" | "giua", ngayMua: "yyyy-mm-dd", daMuaDotDau: boolean }. Auth qua cookie session (khong nhan id tu body).
export async function POST(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  if (!nguoiDung) return Response.json({ loi: "Chưa đăng nhập." }, { status: 401 });
  if (!nguoiDung.da_duyet) return Response.json({ loi: "Tài khoản đang chờ duyệt." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const ma = String(body?.ma || "").trim().toUpperCase();
  const vong = String(body?.vong || "");
  const ngayMua = String(body?.ngayMua || "");
  if (!MA_HOP_LE.test(ma)) return Response.json({ loi: "Mã không hợp lệ." }, { status: 400 });
  if (vong !== "moi" && vong !== "giua") return Response.json({ loi: "Loại điểm mua không hợp lệ." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayMua)) return Response.json({ loi: "Ngày mua không hợp lệ." }, { status: 400 });
  if (typeof body?.daMuaDotDau !== "boolean") return Response.json({ loi: "Thiếu lựa chọn đã mua đợt đầu." }, { status: 400 });

  try {
    await datMuaThem(nguoiDung.id, { ma, vong, ngayMua, daMuaDotDau: body.daMuaDotDau });
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ loi: String(loi?.message || loi) }, { status: 500 });
  }
}
