import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layThongBao, danhDauDaXem, datPhamVi, layKhoaCongKhai, demDangKyDay } from "@/lib/thongBaoDb";
import { demChuaXem } from "@/lib/thongBao";
import { thongBaoLoi } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";

// GET: danh sach cho chuong thong bao (7 ngay) + so chua xem + trang thai tai khoan + khoa cong khai de bat thong bao ve may.
// KHOA TIN HIEU (2026-10-13): khach chua dang nhap / tai khoan chua duoc duyet KHONG nhan danh sach thong bao tin hieu (ds rong + khoa: true) - cung quy tac voi trang Tong quan, /api/signals va /bo-loc.
export async function GET(request) {
  try {
    const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
    const [{ ds, xemLuc, phamVi }, khoaDay, soMay] = await Promise.all([
      layThongBao(nguoiDung),
      layKhoaCongKhai(),
      nguoiDung ? demDangKyDay(nguoiDung.id) : 0,
    ]);
    const duocXem = nguoiDung?.da_duyet === true || nguoiDung?.la_admin === true;
    return Response.json(
      {
        ds: duocXem ? ds : [],
        khoa: !duocXem,
        // Chua mo chuong lan nao -> chi tinh thong bao 24 gio qua la "chua xem" (khong hien 9+ ngay lan dau).
        chuaXem: nguoiDung ? (duocXem ? demChuaXem(ds, xemLuc ?? new Date(Date.now() - 86400e3)) : 0) : null,
        xemLuc,
        nguoiDung: nguoiDung ? { laAdmin: nguoiDung.la_admin === true, daDuyet: nguoiDung.da_duyet === true, phamVi, soMay } : null,
        khoaDay,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 500 });
  }
}

// POST { hanhDong: "da_xem" } | { hanhDong: "pham_vi", phamVi } - can dang nhap.
export async function POST(request) {
  const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value);
  if (!nguoiDung) return Response.json({ loi: "Cần đăng nhập." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  try {
    if (body?.hanhDong === "da_xem") await danhDauDaXem(nguoiDung.id);
    else if (body?.hanhDong === "pham_vi") await datPhamVi(nguoiDung.id, body.phamVi);
    else return Response.json({ loi: "Hành động không hợp lệ." }, { status: 400 });
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ loi: thongBaoLoi(loi) }, { status: 400 });
  }
}
