import { withDb } from "@/lib/db";

// Chan doan toc do (can header x-api-key): vung chay cua ham, vung cua DB (chi lay phan vung trong ten host, KHONG lo mat khau/host day du),
// thoi gian mo ket noi va 1 vong di-ve toi DB. Dung de chon dung "Function Region" tren Vercel gan DB.
export const dynamic = "force-dynamic";

const dangDo = async (fn) => {
  const t0 = performance.now();
  await fn();
  return Math.round(performance.now() - t0);
};

export async function GET(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  if (!dungKey || key !== dungKey) return Response.json({ trangThai: "loi", thongBao: "Sai hoặc thiếu API key" }, { status: 401 });

  const cs = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || "";
  const host = (/@([^/:?]+)/.exec(cs) || [])[1] || "";
  const vungDb = (/\.([a-z]{2}-[a-z]+-\d)\.(?:aws|azure)\.neon\.tech/.exec(host) || [])[1] || null;

  try {
    const lanDau = await dangDo(() => withDb(async (c) => c.query("SELECT 1")));
    const lanHai = await dangDo(() => withDb(async (c) => c.query("SELECT 1")));
    const nhieuVong = await dangDo(() =>
      withDb(async (c) => {
        for (let i = 0; i < 5; i++) await c.query("SELECT 1");
      })
    );
    return Response.json({
      trangThai: "ok",
      vungHam: process.env.VERCEL_REGION || null,
      vungDb,
      dbPooler: host.includes("-pooler"),
      ms: { lanDauCoMoKetNoi: lanDau, lanHaiDungLaiKetNoi: lanHai, nam_truyVanLienTiep: nhieuVong },
    });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi), vungHam: process.env.VERCEL_REGION || null, vungDb }, { status: 500 });
  }
}
