import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { layDongTienThiTruong, layDongTienMa } from "@/lib/dongTien";
import { thongBaoLoi } from "@/lib/loiAnToan";

// GET /api/dong-tien            -> dong tien thi truong (tong, VN30, chi so, top ma, theo nganh)
// GET /api/dong-tien?ma=VPB     -> dong tien 1 ma (tom tat + chuoi theo phut + volume profile + 6 ngay truoc)
// Chi cho thanh vien da duoc duyet (giong cac tin hieu khac).
export const dynamic = "force-dynamic";

export async function GET(request) {
  const nguoiDung = await layNguoiDungHienTai().catch(() => null);
  if (!nguoiDung?.da_duyet) return Response.json({ loi: "Can dang nhap tai khoan da duoc duyet" }, { status: 401 });
  const ma = new URL(request.url).searchParams.get("ma");
  try {
    const du = ma ? await layDongTienMa(ma) : await layDongTienThiTruong();
    return Response.json({ trangThai: "ok", du }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: 500 });
  }
}
