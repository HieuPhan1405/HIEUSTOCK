import { layCauHinhZalo, luuCauHinhZalo, guiTinNhanZalo } from "@/lib/zalo";

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// GET: xem trang thai ket noi hien tai (khong tra secret_key/token that ra
// ngoai, chi bao co/khong).
export async function GET(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  const cauHinh = await layCauHinhZalo();
  return Response.json({
    trangThai: "ok",
    daCoAppId: !!cauHinh?.app_id,
    appId: cauHinh?.app_id || "",
    daKetNoi: !!cauHinh?.access_token,
    daCoNguoiNhan: !!cauHinh?.user_id,
  });
}

// POST body: { hanhDong: "luu" | "guiThu", appId, secretKey, baseUrl, noiDung }
// "luu": luu App ID + Secret Key, tra ve link OAuth de bam ket noi.
// "guiThu": gui 1 tin nhan test toi nguoi nhan da luu.
export async function POST(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }
  const body = await request.json();

  if (body.hanhDong === "guiThu") {
    const ketQua = await guiTinNhanZalo(body.noiDung || "🔔 Tin nhắn test từ CloudStock.");
    return Response.json({ trangThai: ketQua.gui ? "ok" : "loi", ...ketQua });
  }

  const { appId, secretKey, baseUrl } = body;
  if (!appId || !secretKey || !baseUrl) {
    return Response.json({ loi: "Can du appId, secretKey, baseUrl" }, { status: 400 });
  }
  await luuCauHinhZalo({ app_id: appId, secret_key: secretKey });

  const state = Buffer.from(`${appId}:${secretKey}`, "utf-8").toString("base64url");
  const redirectUri = encodeURIComponent(`${baseUrl}/api/zalo/oauth-callback`);
  const linkKetNoi = `https://oauth.zaloapp.com/v4/oa/permission?app_id=${appId}&redirect_uri=${redirectUri}&state=${state}`;

  return Response.json({ trangThai: "ok", linkKetNoi });
}
