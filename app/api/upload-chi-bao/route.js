import { withDb } from "@/lib/db";
import { ghiChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { MA_HOP_LE } from "@/lib/lichSuGia";

// Nhan CSV chi bao ky thuat tu engine (engine/loi/chiBaoLoc.js xayDungCsvChiBao): header ma,ngay_nen + cac cot trong lib/cotChiBaoKyThuat.js.
// Moi dong = 1 ma, trang thai HIEN TAI (upsert theo ma, khong xoa ma nao). Cung API key voi /api/upload-signals.
function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// Dong nao so cot khong khop header thi bo qua (giong upload-signals).
function phanTichCSV(vanBan) {
  const dong = vanBan.trim().split(/\r?\n/);
  const header = dong[0].split(",").map((h) => h.trim());
  const ketQua = [];
  let soDongLoi = 0;
  for (let i = 1; i < dong.length; i++) {
    if (!dong[i].trim()) continue;
    const cot = dong[i].split(",");
    if (cot.length !== header.length) {
      soDongLoi++;
      continue;
    }
    const hang = {};
    header.forEach((ten, idx) => (hang[ten] = cot[idx].trim()));
    ketQua.push(hang);
  }
  return { hang: ketQua, soDongLoi };
}

export async function POST(request) {
  if (!kiemTraApiKey(request)) return Response.json({ loi: "API key khong dung" }, { status: 401 });

  const vanBan = await request.text();
  if (!vanBan || !vanBan.trim()) return Response.json({ loi: "Noi dung CSV rong" }, { status: 400 });

  const { hang: hangTho, soDongLoi } = phanTichCSV(vanBan);
  const hang = hangTho.filter((h) => MA_HOP_LE.test(h.ma ?? ""));
  if (hang.length === 0) return Response.json({ loi: "Khong co dong hop le nao", soDongLoiDaBoQua: soDongLoi }, { status: 400 });

  await withDb((client) => ghiChiBaoKyThuat(client, hang));
  return Response.json({ trangThai: "ok", soDongDaLuu: hang.length, soDongLoiDaBoQua: soDongLoi });
}
