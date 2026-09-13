import { layCauChuyen, themCauChuyen, xoaCauChuyen } from "@/lib/noiDung";

const LOAI_HOP_LE = ["dong_luc", "theo_doi", "rui_ro"];

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

export async function GET(request) {
  const ma = new URL(request.url).searchParams.get("ma");
  if (!ma) return Response.json({ loi: "Thieu tham so ma" }, { status: 400 });
  try {
    const rows = await layCauChuyen(ma);
    return Response.json({ trangThai: "ok", cauChuyen: rows });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

export async function POST(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  const body = await request.json();
  const { ma, loai, noiDung, ngay } = body || {};
  if (!ma || !LOAI_HOP_LE.includes(loai) || !noiDung) {
    return Response.json({ loi: "Thieu ma / loai (dong_luc|theo_doi|rui_ro) / noiDung" }, { status: 400 });
  }
  try {
    const ketQua = await themCauChuyen({ ma, loai, noiDung, ngay });
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
    await xoaCauChuyen(id);
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
