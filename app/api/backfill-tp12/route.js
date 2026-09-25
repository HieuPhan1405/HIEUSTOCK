import { layUngVienTP12, layTPDaGhi, ghiLenhDaDong, ngayChamTP, ngayGiaoDichVN } from "@/lib/lenhDaDong";
import { dongNapBuTP12 } from "@/lib/chotLoiTungPhan";
import { layLichSuGia } from "@/lib/lichSuGia";

// Nap bu 1 lan cac dong CHOT LOI TP1/TP2 cho cac ma DANG GIU da cham TP1/TP2 tu truoc khi web ghi tung phan chot loi vao "Lenh da dong".
// Ngay chot = ngay dau tien sau ngay mua co gia cao nhat >= muc TP (theo lich su gia); khong tra duoc thi lay ngay giao dich gan nhat.
//   GET  /api/backfill-tp12            -> chi XEM TRUOC (khong ghi)
//   POST /api/backfill-tp12?ap-dung=1  -> ghi vao lenh_da_dong (an toan chay lai: UNIQUE (ma, ngay_mua, vong) + DO NOTHING, bo qua dong da co)
// Sau khi nap bu, cac vi the nay chuyen sang theo doi KIEU MOI: cham TP3 chi ghi phan 25%, dong lenh chi ghi phan con lai.
// Can header x-api-key giong cac route upload.
export const dynamic = "force-dynamic";

async function xuLy(request, apDung) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });

  try {
    const ungVien = await layUngVienTP12();
    const daGhi = await layTPDaGhi(ungVien.map((u) => u.ma));
    const ketQua = [];
    for (const u of ungVien) {
      let nen = null;
      try {
        nen = await layLichSuGia(u.ma);
      } catch {
        nen = null;
      }
      ketQua.push(...dongNapBuTP12(u, nen, ngayChamTP, ngayGiaoDichVN(), daGhi));
    }
    const daGhiDong = apDung ? await ghiLenhDaDong(ketQua) : 0;
    return Response.json({ trangThai: "ok", apDung, soUngVien: ungVien.length, soDongNapBu: ketQua.length, daGhi: daGhiDong, ketQua });
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
