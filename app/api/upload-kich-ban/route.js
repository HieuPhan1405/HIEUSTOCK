import { withDb } from "@/lib/db";
import { ghiKichBanMua } from "@/lib/kichBanMuaDb";
import { MA_HOP_LE } from "@/lib/lichSuGia";

// Nhan JSON { hang: [...], daydu: bool } tu engine/dich-vu/kichBanMua.mjs --upload: moi phan tu = kich ban mua cua 1 ma (ten truong: lib/db.js KICH_BAN_MUA_COT_*).
// daydu=true: lan quet toan bo -> ma khong co mat bi xoa (xem ghiKichBanMua). Cung API key voi /api/upload-signals.
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
  const hang = (Array.isArray(body?.hang) ? body.hang : []).filter((h) => h && MA_HOP_LE.test(h.ma ?? ""));
  if (hang.length === 0) return Response.json({ loi: "Khong co dong hop le nao" }, { status: 400 });
  if (hang.length > 1000) return Response.json({ loi: "Qua nhieu dong" }, { status: 400 });

  const soDong = await withDb((client) => ghiKichBanMua(client, hang, { daydu: body.daydu === true }));
  return Response.json({ trangThai: "ok", soDongDaLuu: soDong });
}
