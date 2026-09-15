import { doiCodeLayToken } from "@/lib/zalo";

// Zalo redirect nguoi dung ve day sau khi bam "Cho phep" o buoc cap quyen
// OAuth, kem query string ?code=...&oa_id=... . State (chua appId/secretKey
// ma chinh admin da nhap o /quan-tri) duoc truyen qua tham so "state" de tra
// cuu lai cap App ID/Secret Key tuong ung (Zalo khong gui lai secret_key).
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // "appId:secretKey" da ma hoa base64 o buoc tao link

  if (!code || !state) {
    return new Response("Thieu code hoac state tu Zalo.", { status: 400 });
  }

  let appId, secretKey;
  try {
    const giaiMa = Buffer.from(state, "base64url").toString("utf-8");
    [appId, secretKey] = giaiMa.split(":");
  } catch {
    return new Response("State khong hop le.", { status: 400 });
  }

  try {
    await doiCodeLayToken(appId, secretKey, code);
    return new Response(
      `<html><body style="font-family:sans-serif;padding:40px">
        <h2>✅ Đã kết nối Zalo OA thành công!</h2>
        <p>Bây giờ hãy mở app Zalo, tìm đúng Official Account bạn vừa tạo, và tự nhắn 1 tin bất kỳ (ví dụ "hi") cho nó để hệ thống nhận diện bạn là người nhận thông báo.</p>
        <p>Sau đó quay lại trang /quan-tri để kiểm tra và gửi thử.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (loi) {
    return new Response("Loi khi doi token: " + String(loi?.message || loi), { status: 500 });
  }
}
