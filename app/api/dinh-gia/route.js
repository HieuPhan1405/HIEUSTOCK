import { layDinhGia, themDinhGia, xoaDinhGia } from "@/lib/noiDung";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

export async function GET(request) {
  const ma = new URL(request.url).searchParams.get("ma");
  if (!ma) return Response.json({ loi: "Thieu tham so ma" }, { status: 400 });
  try {
    const rows = await layDinhGia(ma);
    return Response.json({ trangThai: "ok", dinhGia: rows });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

export async function POST(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  const body = await request.json();
  const { ma, congTyCK, ngayDinhGia, giaMucTieu } = body || {};
  if (!ma || !congTyCK || !giaMucTieu) {
    return Response.json({ loi: "Thieu ma / congTyCK / giaMucTieu" }, { status: 400 });
  }
  try {
    const ketQua = await themDinhGia({ ma, congTyCK, ngayDinhGia, giaMucTieu: Number(giaMucTieu) });
    return Response.json({ trangThai: "ok", id: ketQua.id });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ loi: "Thieu id" }, { status: 400 });
  try {
    await xoaDinhGia(id);
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
