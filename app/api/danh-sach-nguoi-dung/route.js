import { layTatCaNguoiDung } from "@/lib/nguoiDung";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// GET: chi admin (dung tu trang /quan-tri) duoc xem danh sach SDT da dang ky
// - muc dich thu thap SDT khach truy cap de tien tu van, khong dung de khoa
// noi dung website.
export async function GET(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  try {
    const rows = await layTatCaNguoiDung();
    return Response.json({ trangThai: "ok", nguoiDung: rows });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
