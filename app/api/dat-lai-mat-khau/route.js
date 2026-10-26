import { datLaiMatKhau } from "@/lib/nguoiDung";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// POST { id }: chi admin (trang /quan-tri, co API key). Khach quen mat khau -> tao mat khau tam, tra ve 1 lan de admin gui lai cho khach; khach dang nhap xong nen tu doi.
export async function POST(request) {
  if (!kiemTraApiKey(request)) return Response.json({ loi: "API key khong dung" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  const id = Number(body?.id);
  if (!Number.isFinite(id)) return Response.json({ loi: "Thiếu id người dùng" }, { status: 400 });
  try {
    const kq = await datLaiMatKhau(id);
    return Response.json({ trangThai: "ok", ...kq }, { headers: { "Cache-Control": "no-store" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
