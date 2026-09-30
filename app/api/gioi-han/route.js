import { layDanhSachChan } from "@/lib/gioiHan";

export const dynamic = "force-dynamic";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// GET: chi admin (can x-api-key) - xem DANH SACH IP / SDT DANG BI CHAN (dang nhap sai nhieu, dang ky / gui lien he qua nhieu) va nhung cai DANG TIEN GAN nguong.
// IP that chi luu trong bang gioi han va tu xoa sau 1 ngay; chi tinh tu luc bat tinh nang ghi IP (cac dong cu khong co IP khong hien).
export async function GET(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  try {
    const kq = await layDanhSachChan();
    return Response.json({ trangThai: "ok", ...kq });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
