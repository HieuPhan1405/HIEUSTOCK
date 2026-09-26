import { layTP3CuDangGiu, xoaTP3CuDaCoTP12, ghiLenhDaDong, ngayChamTP } from "@/lib/lenhDaDong";
import { dongNapBuTP12 } from "@/lib/chotLoiTungPhan";
import { layLichSuGia } from "@/lib/lichSuGia";

// CHUYEN LENH CU "chot TP3 gop 85%" (cach 30/30/25 + 15% chay) sang CACH MOI cho cac lenh VAN DANG GIU: 1 dong TP3 85% -> 2 dong chot 30% o TP1 (vong 5) + 30% o TP2 (vong 6),
// 40% con lai giu den tin hieu BAN (khi dong se ghi dong phan con lai 40% - xem tinhDongPhanConLai). Ngay chot = ngay dau tien sau ngay mua gia cao nhat cham moc (lich su gia);
// khong tra duoc thi lay ngay cua dong TP3 cu. Gia chot = TP da dong bang luc mua (vao_tp / tp). Lenh cu da ket thuc giu nguyen lich su.
//   GET  /api/chuyen-tp3-cu            -> chi XEM TRUOC (khong ghi)
//   POST /api/chuyen-tp3-cu?ap-dung=1  -> ghi dong TP1/TP2 (UNIQUE + DO NOTHING) roi xoa dong TP3 cu cua lenh da co du TP1 + TP2; tra ve cac dong da xoa (ban sao).
// Can header x-api-key giong cac route upload.
export const dynamic = "force-dynamic";

async function xuLy(request, apDung) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });

  try {
    const ungVien = await layTP3CuDangGiu();
    const dongMoi = [];
    for (const u of ungVien) {
      let nen = null;
      try {
        nen = await layLichSuGia(u.ma);
      } catch {
        nen = null;
      }
      // Gia mua = gia cua chinh lenh trong nhat ky (khong lay gia hien tai cua tin_hieu) de cac dong cung 1 lenh khop nhau; TP3 chi la moc tham khao -> chot toi TP2.
      const lenh = { ...u, gia_vao_web: u.gia_mua_lenh, gia_mua: u.gia_mua_lenh, tp_da_cham: "TP2" };
      dongMoi.push(...dongNapBuTP12(lenh, nen, ngayChamTP, u.ngay_ban_tp3));
    }
    let daGhi = 0;
    let daXoa = [];
    if (apDung) {
      daGhi = await ghiLenhDaDong(dongMoi.map(({ ngayTuLichSuGia, ...d }) => d));
      daXoa = await xoaTP3CuDaCoTP12(ungVien.map((u) => u.id));
    }
    return Response.json({ trangThai: "ok", apDung, soLenh: ungVien.length, soDongMoi: dongMoi.length, daGhi, soDaXoa: daXoa.length, dongMoi, daXoa, ungVien });
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
