import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { toggleThamGia, layDemThamGiaTatCa, layMaDaThamGia, datGhiChuThamGia, GHI_CHU_TOI_DA } from "@/lib/thamGia";
import { thongBaoLoi } from "@/lib/loiAnToan";

const TEN_COOKIE = "cs_token";

// GET: tra ve so nguoi tham gia MOI ma + danh sach ma nguoi dung HIEN TAI
// (neu da dang nhap) da tham gia - dung 1 lan de ve toan bo Bo loc/So lenh mo.
export async function GET(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  const [demTatCa, maCuaToi] = await Promise.all([
    layDemThamGiaTatCa(),
    layMaDaThamGia(nguoiDung?.id),
  ]);
  return Response.json({ demTatCa, maCuaToi });
}

// POST: bam Tham gia/Roi 1 ma - BAT BUOC da dang nhap.
export async function POST(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  if (!nguoiDung) {
    return Response.json({ loi: "Cần đăng nhập để tham gia." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  const ma = String(body?.ma || "").trim().toUpperCase();
  if (!ma) {
    return Response.json({ loi: "Thiếu mã cổ phiếu" }, { status: 400 });
  }
  try {
    const ketQua = await toggleThamGia(nguoiDung.id, ma);
    return Response.json({ trangThai: "ok", ...ketQua });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 500 });
  }
}

// PATCH: luu GHI CHU RIENG cua nguoi dung cho 1 ma da tham gia ({ ma, ghiChu }, rong = xoa) - bat buoc da dang nhap va duoc duyet.
export async function PATCH(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return Response.json({ loi: "Cần đăng nhập bằng tài khoản đã được duyệt." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  const ma = String(body?.ma || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(ma)) {
    return Response.json({ loi: "Mã cổ phiếu không hợp lệ" }, { status: 400 });
  }
  if (typeof body?.ghiChu !== "string" || body.ghiChu.length > GHI_CHU_TOI_DA * 4) {
    return Response.json({ loi: "Ghi chú không hợp lệ" }, { status: 400 });
  }
  try {
    const daLuu = await datGhiChuThamGia(nguoiDung.id, ma, body.ghiChu);
    if (daLuu === null) return Response.json({ loi: "Bạn chưa theo dõi mã này." }, { status: 404 });
    return Response.json({ trangThai: "ok", ghiChu: daLuu });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 500 });
  }
}
