import { doiSoatLenhDaDong, ngayGiaoDichVN } from "@/lib/lenhDaDong";
import { xoaBoNhoTinHieu } from "@/lib/tinHieu";

// Doi soat thu cong Lenh da dong voi tin hieu hien tai (cung logic tu chay sau moi lan upload):
//   GET  /api/doi-soat-lenh-dong            -> chi XEM cac lenh se duoc MO LAI (dang giu lai nhung bi ghi la da dong)
//   POST /api/doi-soat-lenh-dong?ap-dung=1  -> ap dung (xoa dong dong sai + cap nhat gia chot trong ngay)
// Can header x-api-key giong cac route upload.
export const dynamic = "force-dynamic";

async function xuLy(request, apDung) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });
  try {
    const kq = await doiSoatLenhDaDong({ apDung, ngayHomNay: ngayGiaoDichVN() });
    if (apDung) xoaBoNhoTinHieu();
    return Response.json({ trangThai: "ok", apDung, moLai: kq.moLai, capNhatGia: kq.capNhat });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

export async function GET(request) {
  return xuLy(request, false);
}

export async function POST(request) {
  return xuLy(request, new URL(request.url).searchParams.get("ap-dung") === "1");
}
