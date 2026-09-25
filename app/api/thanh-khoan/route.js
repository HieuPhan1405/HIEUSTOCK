import { layNenPhutNgay, MA_HOP_LE } from "@/lib/lichSuGia";
import { layChuoiThanhKhoanHOSE, layBangGiaHOSENgay, topGTGD, ngayVNHomNay } from "@/lib/thiTruongHOSE";

// Thanh khoan trong phien (mac dinh VNINDEX, dai dien toan thi truong): GET /api/thanh-khoan?ma=VNINDEX
// So sanh PHIEN MOI NHAT (hom nay neu dang/da giao dich, neu khong la phien gan nhat) voi PHIEN LIEN TRUOC + TB20. Tra ve:
//  - ngay: chuoi GTGD TONG (khop + thoa thuan, ty dong) toan san HOSE 23 phien gan nhat (VNDirect) - phan tu cuoi la phien moi nhat.
//  - nenA / nenB: khoi luong khop tung phut cua ma trong phien moi nhat / phien truoc (DNSE) [{ t (epoch giay), v }] - chi de lay HINH DANG
//    duong tich luy trong phien; client quy doi ra tien bang tong GTGD cua tung ngay.
//  - top: top ma GTGD cao nhat phien moi nhat.
export async function GET(request) {
  const ma = String(new URL(request.url).searchParams.get("ma") || "VNINDEX").toUpperCase();
  if (!MA_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });

  try {
    const ngay = await layChuoiThanhKhoanHOSE(23);
    if (ngay.length < 2) return Response.json({ trangThai: "loi", thongBao: "Chưa đủ dữ liệu phiên để so sánh." }, { status: 502 });
    const a = ngay[ngay.length - 1];
    const b = ngay[ngay.length - 2];
    const [nenA, nenB, bang] = await Promise.all([layNenPhutNgay(ma, a.ngay), layNenPhutNgay(ma, b.ngay), layBangGiaHOSENgay(a.ngay)]);
    const gon = (nen) => nen.map((x) => ({ t: x.t, v: x.v }));
    return Response.json(
      { trangThai: "ok", ma, laHomNay: a.ngay === ngayVNHomNay(), ngay, nenA: gon(nenA), nenB: gon(nenB), top: topGTGD(bang, 10) },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
    );
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 502 });
  }
}
