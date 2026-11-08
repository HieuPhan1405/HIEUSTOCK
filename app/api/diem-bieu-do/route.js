import { layNguoiDungTuToken } from "@/lib/nguoiDung";
import { withDb, daoDamBangBatDay, daoDamBangDiemB } from "@/lib/db";
import { MA_HOP_LE } from "@/lib/lichSuGia";
import { thongBaoLoi } from "@/lib/loiAnToan";

// DIEM B (mua phuc hoi) + DIEM BAT DAY (checklist) cua 1 ma de ve len bieu do gia: GET /api/diem-bieu-do?ma=FPT
// Cung noi dung voi cac trang /mua-phuc-hoi va /bat-day (chi thanh vien da duyet xem duoc) nen khach / chua duyet chi nhan { khoa: true } - khong lo du lieu ra trang /ma/[ma] cong khai.
export const dynamic = "force-dynamic";
const TEN_COOKIE = "cs_token";

export async function GET(request) {
  const ma = String(new URL(request.url).searchParams.get("ma") || "").toUpperCase();
  if (!MA_HOP_LE.test(ma)) return Response.json({ loi: "Mã không hợp lệ" }, { status: 400 });
  try {
    const nguoiDung = await layNguoiDungTuToken(request.cookies.get(TEN_COOKIE)?.value).catch(() => null);
    if (!(nguoiDung?.da_duyet || nguoiDung?.la_admin)) return Response.json({ khoa: true, b: [], batDay: [] }, { headers: { "Cache-Control": "no-store" } });
    const du = await withDb(async (client) => {
      await daoDamBangDiemB(client);
      await daoDamBangBatDay(client);
      const [b, bd] = await Promise.all([
        client.query(
          `SELECT to_char(ngay, 'YYYY-MM-DD') AS ngay, gia_b, giam, kl_day, to_char(ngay_cat_lo, 'YYYY-MM-DD') AS ngay_cat_lo, tp_cham, dong_tien
           FROM diem_b_su_kien WHERE ma = $1 ORDER BY ngay`,
          [ma]
        ),
        client.query(
          `SELECT to_char(ngay_tin_hieu, 'YYYY-MM-DD') AS ngay, diem, gia_luc_tin_hieu AS gia, chiet_khau, pct_sau_20
           FROM bat_day_su_kien WHERE ma = $1 ORDER BY ngay_tin_hieu`,
          [ma]
        ),
      ]);
      return { b: b.rows, batDay: bd.rows };
    });
    return Response.json({ khoa: false, ...du }, { headers: { "Cache-Control": "private, max-age=120" } });
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: 500 });
  }
}
