import { layTatCaTinHieu } from "@/lib/tinHieu";

// Tra ve danh sach tin hieu hien tai. Dung boi trang chu cu (fallback) va
// bat ky noi nao can du lieu qua fetch client-side thay vi server component.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hangDL = await layTatCaTinHieu();
    return Response.json({ trangThai: "ok", capNhatLanCuoi: hangDL[0]?.cap_nhat_luc ?? null, tinHieu: hangDL });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
