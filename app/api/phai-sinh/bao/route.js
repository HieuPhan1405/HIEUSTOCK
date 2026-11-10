import { layTrangThaiPhaVo } from "@/lib/phaVoPhaiSinhDuLieu";
import { baoPhaiSinh } from "@/lib/thongBaoDb";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";

// Tien trinh engine (engine/dich-vu/chayEngineRealTime.mjs) goi moi ~30 giay trong gio giao dich: tinh trang thai phai sinh hom nay roi gui thong bao day ve may cho cac su kien MOI
// (vao lenh, vao lai sau cat lo, cat lo, thoat, dong cuoi phien). Khoa chong trung theo ngay + buoc nen goi nhieu lan khong bao lai. Can x-api-key (UPLOAD_API_KEY).
// Neu engine khong chay, trang /phai-sinh dang mo cung goi cung ham nay moi lan lam moi (xem app/api/phai-sinh/route.js).
export async function POST(request) {
  const key = request.headers.get("x-api-key");
  if (!process.env.UPLOAD_API_KEY || key !== process.env.UPLOAD_API_KEY) return Response.json({ loi: "API key không đúng" }, { status: 401 });
  try {
    const st = await layTrangThaiPhaVo();
    const kq = await baoPhaiSinh(st);
    return Response.json({ trangThai: "ok", ngay: st.ngay, pha: st.pha, trangThaiLenh: st.bienDong?.trangThaiNgay ?? st.bienDong?.trangThai, ...kq });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 502 });
  }
}
