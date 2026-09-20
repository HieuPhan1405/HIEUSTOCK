import { layTatCaTinHieu } from "@/lib/tinHieu";

// Tra ve danh sach tin hieu hien tai. Dung boi trang chu cu (fallback) va
// bat ky noi nao can du lieu qua fetch client-side thay vi server component.
// ?bang=chikou: doc BANG THU NGHIEM (ket qua file AFL 10) de kiem tra du lieu da len chua.
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const khoaBang = new URL(request.url).searchParams.get("bang") === "chikou" ? "chikou" : "thuong";
    const hangDL = await layTatCaTinHieu(khoaBang);
    return Response.json({ trangThai: "ok", bang: khoaBang, capNhatLanCuoi: hangDL[0]?.cap_nhat_luc ?? null, tinHieu: hangDL });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
