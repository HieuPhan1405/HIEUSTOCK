import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { luuDangKyDay, xoaDangKyDay, guiDay } from "@/lib/thongBaoDb";

const TEN_COOKIE = "cs_token";

// THONG BAO VE MAY cua trinh duyet dang dung - can dang nhap (gan voi tai khoan de biet ai duoc nhan gi).
// POST { hanhDong: "bat", sub } luu dang ky; { hanhDong: "tat", endpoint } xoa; { hanhDong: "thu" } gui 1 thong bao thu toi cac trinh duyet cua chinh tai khoan nay.
export async function POST(request) {
  const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
  if (!nguoiDung) return Response.json({ loi: "Cần đăng nhập để bật thông báo." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  try {
    if (body?.hanhDong === "bat") {
      await luuDangKyDay(nguoiDung.id, body.sub);
      return Response.json({ trangThai: "ok" });
    }
    if (body?.hanhDong === "tat") {
      await xoaDangKyDay(nguoiDung.id, body.endpoint);
      return Response.json({ trangThai: "ok" });
    }
    if (body?.hanhDong === "thu") {
      const kq = await guiDay(
        [{ khoa: `thu:${Date.now()}`, loai: "thu", tieu_de: "CloudStock: thông báo đã bật ✓", noi_dung: "Thông báo về máy đã hoạt động trên thiết bị này.", duong_dan: "/" }],
        { chiNguoiDungId: nguoiDung.id }
      );
      if (!kq.daGui) return Response.json({ loi: kq.loi || "Chưa gửi được — thử tắt rồi bật lại thông báo." }, { status: 400 });
      return Response.json({ trangThai: "ok", ...kq });
    }
    return Response.json({ loi: "Hành động không hợp lệ." }, { status: 400 });
  } catch (loi) {
    return Response.json({ loi: String(loi?.message || loi) }, { status: 400 });
  }
}
