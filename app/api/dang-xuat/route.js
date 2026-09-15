import { dangXuat } from "@/lib/nguoiDung";

const TEN_COOKIE = "cs_token";

function xoaCookie() {
  const cac = [`${TEN_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") cac.push("Secure");
  return cac.join("; ");
}

export async function POST(request) {
  const token = request.cookies.get(TEN_COOKIE)?.value;
  await dangXuat(token);
  return Response.json({ trangThai: "ok" }, { headers: { "Set-Cookie": xoaCookie() } });
}
