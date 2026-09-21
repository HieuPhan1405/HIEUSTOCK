import { layUngVienTP3, ghiLenhDaDong, tinhChotTP3, ngayChamTP, ngayGiaoDichVN } from "@/lib/lenhDaDong";
import { layLichSuGia } from "@/lib/lichSuGia";

// Nap 1 lan cac lenh DA cham du TP3 tu truoc khi web co tinh nang (ma dang giu, tp_da_cham = TP3, chua co trong Lenh da dong).
// Ngay chot = ngay dau tien sau ngay mua co gia cao nhat >= TP3 (theo lich su gia); khong tra duoc thi lay ngay giao dich gan nhat.
//   GET  /api/backfill-tp3            -> chi XEM TRUOC (khong ghi)
//   POST /api/backfill-tp3?ap-dung=1  -> ghi vao lenh_da_dong (an toan chay lai: UNIQUE (ma, ngay_mua) + DO NOTHING)
// Can header x-api-key giong cac route upload.
export const dynamic = "force-dynamic";

async function xuLy(request, apDung) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });

  try {
    const ungVien = await layUngVienTP3();
    const ketQua = [];
    for (const u of ungVien) {
      const giaMua = Number(u.gia_vao_web) > 0 ? u.gia_vao_web : u.gia_mua;
      const tp = [1, 2, 3].map((i) => (Number(u[`vao_tp${i}`]) > 0 ? u[`vao_tp${i}`] : u[`tp${i}`]));
      let cham = null;
      try {
        cham = ngayChamTP(await layLichSuGia(u.ma), u.ngay_mua_txt, Number(tp[2]));
      } catch {
        cham = null;
      }
      const r = tinhChotTP3({
        giaMua,
        tp1: tp[0],
        tp2: tp[1],
        tp3: tp[2],
        ngayMua: u.ngay_mua_txt,
        ngayBan: cham?.ngay ?? ngayGiaoDichVN(),
        soPhien: cham?.soPhien ?? (u.so_phien_giu != null ? Number(u.so_phien_giu) : null),
      });
      ketQua.push(r ? { ma: u.ma, ...r, ngayTuLichSuGia: !!cham } : { ma: u.ma, boQua: "mức TP không hợp lệ" });
    }
    const hopLe = ketQua.filter((x) => !x.boQua);
    const daGhi = apDung ? await ghiLenhDaDong(hopLe) : 0;
    return Response.json({ trangThai: "ok", apDung, soUngVien: ungVien.length, daGhi, ketQua });
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
