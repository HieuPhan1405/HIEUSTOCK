import { layNenPhutHomNay, MA_HOP_LE } from "@/lib/lichSuGia";
import { layChuoiThanhKhoanHOSE } from "@/lib/thiTruong";

// Thanh khoan trong phien (mac dinh VNINDEX, dai dien toan thi truong): GET /api/thanh-khoan?ma=VNINDEX
// Tra ve:
//  - nen: mang nen PHUT hom nay cua ma (khoi luong khop lenh tung phut, nguon DNSE) - dung de ve HINH
//    DANG duong tich luy trong phien (chinh xac tung phut nhung chi la khoi luong CUA RIENG ma nay).
//  - ngay: chuoi GTGD/KL TOAN SAN HOSE 21 phien gan nhat (nguon VNDirect, tong tat ca ma) - dung de
//    QUY DOI duong tren ra tien (tyDong) theo ty le, tinh duong TB20 va so sanh voi phien truoc.
export async function GET(request) {
  const ma = String(new URL(request.url).searchParams.get("ma") || "VNINDEX").toUpperCase();
  if (!MA_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });

  try {
    const [nen, ngay] = await Promise.all([layNenPhutHomNay(ma), layChuoiThanhKhoanHOSE(21)]);
    return Response.json({ trangThai: "ok", ma, nen, ngay }, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 502 });
  }
}
