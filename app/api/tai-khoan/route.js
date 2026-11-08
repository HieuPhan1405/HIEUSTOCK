import { layNguoiDungTuToken, layHoSo } from "@/lib/nguoiDung";
import { datNhom, datPhamVi, layKhoaCongKhai } from "@/lib/thongBaoDb";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
const TEN_COOKIE = "cs_token";

// TRANG CA NHAN /tai-khoan - chi doc / sua CHINH tai khoan dang dang nhap (id lay tu cookie phien, khong nhan id tu client).
//   GET  -> { hoSo: { sdt, email, ten, laAdmin, daDuyet, taoLuc, phamVi, nhom, soMa, soMay }, khoaDay }
//   POST { hanhDong: "nhom", nhom: [khoa nhom thong bao da tich] } | { hanhDong: "pham_vi", phamVi: "tat_ca" | "danh_muc" | "khong" }
// Doi ten: /api/doi-ten, doi mat khau: /api/doi-mat-khau (da co).
export async function GET(request) {
  try {
    const nd = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
    if (!nd) return Response.json({ loi: "Chưa đăng nhập." }, { status: 401 });
    const [hoSo, khoaDay] = await Promise.all([layHoSo(nd.id), layKhoaCongKhai()]);
    if (!hoSo) return Response.json({ loi: "Không tìm thấy tài khoản." }, { status: 404 });
    return Response.json({ trangThai: "ok", hoSo, khoaDay }, { headers: { "Cache-Control": "no-store" } });
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 500 });
  }
}

export async function POST(request) {
  const nd = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
  if (!nd) return Response.json({ loi: "Chưa đăng nhập." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  try {
    if (body.hanhDong === "nhom") return Response.json({ trangThai: "ok", nhom: await datNhom(nd.id, body.nhom) });
    if (body.hanhDong === "pham_vi") {
      await datPhamVi(nd.id, body.phamVi);
      return Response.json({ trangThai: "ok", phamVi: body.phamVi });
    }
    return Response.json({ loi: "Hành động không hợp lệ." }, { status: 400 });
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 400 });
  }
}
