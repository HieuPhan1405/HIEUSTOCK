import { layNguoiDungTuToken } from "@/lib/nguoiDung";

const TEN_COOKIE = "cs_token";

export async function GET(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  const nguoiDung = await layNguoiDungTuToken(token);
  return Response.json({ nguoiDung });
}
