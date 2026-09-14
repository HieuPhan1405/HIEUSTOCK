import { themLienHe, layTatCaLienHe, danhDauDaDoc, xoaLienHe } from "@/lib/lienHe";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// POST: cong khai - bat ky ai xem web cung gui duoc, khong can API key.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "Du lieu gui len khong dung dinh dang" }, { status: 400 });
  }
  const hoTen = (body?.hoTen || "").trim();
  const lienLac = (body?.lienLac || "").trim();
  const noiDung = (body?.noiDung || "").trim();
  if (!hoTen || !lienLac || !noiDung) {
    return Response.json({ loi: "Cần nhập đủ Họ tên, Liên lạc, Nội dung" }, { status: 400 });
  }
  try {
    const ketQua = await themLienHe({ hoTen, lienLac, noiDung });
    return Response.json({ trangThai: "ok", id: ketQua.id });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

// GET: chi admin (dung tu trang /quan-tri) duoc xem danh sach tin nhan.
export async function GET(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  try {
    const rows = await layTatCaLienHe();
    return Response.json({ trangThai: "ok", lienHe: rows });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

// PATCH: admin danh dau da doc.
export async function PATCH(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ loi: "Thieu id" }, { status: 400 });
  try {
    await danhDauDaDoc(id);
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

// DELETE: chi admin.
export async function DELETE(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ loi: "Thieu id" }, { status: 400 });
  try {
    await xoaLienHe(id);
    return Response.json({ trangThai: "ok" });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}
