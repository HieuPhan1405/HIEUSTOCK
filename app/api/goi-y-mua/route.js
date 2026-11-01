import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { layGoiYMua } from "@/lib/goiYMuaDb";
import { thongBaoLoi } from "@/lib/loiAnToan";

// MA GOI Y MUA theo bo dieu kien da backtest (tinh o lib/goiYMuaDb.js) - trang /danh-gia-danh-muc tu loc theo danh muc cua khach.
// Thanh vien da duyet / quan tri nhan day du; khach chi nhan SO LUONG (de hien loi moi dang ky).
export const dynamic = "force-dynamic";
const TEN_COOKIE = "cs_token";

export async function GET(request) {
  try {
    const [nguoiDung, du] = await Promise.all([layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value).catch(() => null), layGoiYMua()]);
    const laThanhVien = !!(nguoiDung?.da_duyet || nguoiDung?.la_admin);
    if (!laThanhVien) return Response.json({ khoa: true, soDat: du.mua.filter((x) => x.dat).length, soCho: du.cho.length, vni20: du.vni20, capNhat: du.capNhat }, { headers: { "Cache-Control": "no-store" } });
    return Response.json(du, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: 500 });
  }
}
