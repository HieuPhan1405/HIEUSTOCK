import { layThongTinLienHe, luuThongTinLienHe } from "@/lib/thongTinLienHe";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// GET: cong khai - trang /lien-he can doc de hien thi cho tat ca nguoi xem.
export async function GET() {
  try {
    const tt = await layThongTinLienHe();
    return Response.json({ trangThai: "ok", thongTin: tt });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

// POST: chi admin (tu /quan-tri) duoc sua.
export async function POST(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Du lieu gui len khong dung dinh dang" }, { status: 400 });
  }
  try {
    await luuThongTinLienHe(body || {});
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
