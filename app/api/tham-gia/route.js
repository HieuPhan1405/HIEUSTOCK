import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { toggleThamGia, layDemThamGiaTatCa, layMaDaThamGia } from "@/lib/thamGia";

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
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
