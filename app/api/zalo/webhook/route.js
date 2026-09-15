import { luuCauHinhZalo } from "@/lib/zalo";

// Zalo goi POST toi day moi khi co su kien tren OA (nguoi dung nhan tin, bam
// quan tam,...). Ta chi can lay dung user_id cua nguoi GUI dau tien (chinh
// chu web) de luu lam "nguoi nhan thong bao" - CHUA kiem tra chu ky "mac" cua
// Zalo o ban dau nay (rui ro thap vi chi 1 nguoi dung ca nhan, khong phai OA
// cong khai nhieu nguoi theo doi).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: true }); // Zalo chi can HTTP 200, khong quan tam noi dung tra ve
  }

  const userId = body?.sender?.id || body?.follower?.id || null;
  if (userId) {
    try {
      await luuCauHinhZalo({ user_id: userId });
    } catch {
      /* bo qua loi luu - khong lam Zalo retry vo han */
    }
  }

  return Response.json({ ok: true });
}

// Mot so cau hinh webhook can phan hoi GET de xac thuc URL - tra ve 200 don gian.
export async function GET() {
  return Response.json({ ok: true });
}
