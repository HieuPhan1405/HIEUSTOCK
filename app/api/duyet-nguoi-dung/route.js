import { datDaDuyet } from "@/lib/nguoiDung";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// POST: chi admin (dung tu trang /quan-tri) duoc duyet/bo duyet 1 tai khoan SDT.
export async function POST(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Dữ liệu gửi lên không đúng định dạng" }, { status: 400 });
  }
  const id = Number(body?.id);
  if (!Number.isFinite(id)) {
    return Response.json({ loi: "Thiếu id người dùng" }, { status: 400 });
  }
  try {
    await datDaDuyet(id, !!body?.daDuyet);
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
