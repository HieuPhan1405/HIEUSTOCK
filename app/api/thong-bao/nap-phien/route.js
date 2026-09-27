import { thongBaoPhien } from "@/lib/thongBaoDb";

// QUAN TRI: lap thong bao tin hieu cua PHIEN MOI NHAT tu du lieu dang co (giong luc upload) - dung khi vua bat tinh nang / muon nap lai chuong thong bao ma chua co lan upload moi.
//   GET  /api/thong-bao/nap-phien                 -> chi XEM TRUOC cac su kien (khong ghi)
//   POST /api/thong-bao/nap-phien?ap-dung=1       -> ghi vao chuong thong bao (khoa trung thi bo qua), KHONG gui ve may
//   POST /api/thong-bao/nap-phien?ap-dung=1&gui=1 -> ghi + gui ve may cac su kien moi
// Can header x-api-key giong cac route upload.
export const dynamic = "force-dynamic";

async function xuLy(request, ghi) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });
  const url = new URL(request.url);
  try {
    const kq = await thongBaoPhien({ ghi: ghi && url.searchParams.get("ap-dung") === "1", gui: url.searchParams.get("gui") === "1" });
    return Response.json({ trangThai: "ok", ...kq });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 500 });
  }
}

export const GET = (request) => xuLy(request, false);
export const POST = (request) => xuLy(request, true);
