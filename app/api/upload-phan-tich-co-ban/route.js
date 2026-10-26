import { ghiPhanTichCoBan } from "@/lib/phanTichCoBanDb";
import { MA_HOP_LE } from "@/lib/lichSuGia";

// Nhan JSON { rrg?: {...}, ma?: { HPG: {...}, ... } } tu engine/dich-vu/dayPhanTichCoBan.mjs (moi lan toi da ~100 ma). Cung API key voi /api/upload-signals.
export const dynamic = "force-dynamic";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

export async function POST(request) {
  if (!kiemTraApiKey(request)) return Response.json({ loi: "API key khong dung" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ loi: "JSON khong hop le" }, { status: 400 });
  }
  const muc = {};
  if (body?.rrg && typeof body.rrg === "object" && Array.isArray(body.rrg.ketQua)) muc.RRG = body.rrg;
  const dsMa = body?.ma && typeof body.ma === "object" ? Object.entries(body.ma) : [];
  if (dsMa.length > 150) return Response.json({ loi: "Qua nhieu ma" }, { status: 400 });
  for (const [ma, v] of dsMa) if (MA_HOP_LE.test(ma) && v && typeof v === "object" && v.q) muc[`ma:${ma}`] = v;
  if (!Object.keys(muc).length) return Response.json({ loi: "Khong co du lieu hop le" }, { status: 400 });
  const so = await ghiPhanTichCoBan(muc);
  return Response.json({ trangThai: "ok", soMucDaLuu: so });
}
