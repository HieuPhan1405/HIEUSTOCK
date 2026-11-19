import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { withDb, daoDamBangFootprint } from "@/lib/db";
import { gopFootprint, CAU_HINH_KHUNG } from "@/lib/footprint";
import { thongBaoLoi } from "@/lib/loiAnToan";

// GET /api/footprint?ma=VN30F1M&kt=M5 -> footprint (KL mua / ban chu dong theo muc gia trong tung nen) cac ngay gan nhat - chip "Footprint" tren bieu do (khung trong ngay).
// Hien chi co hop dong phai sinh VN30F1M (tick that DNSE). Chi cho thanh vien da duoc duyet.
// May dev (khong co DATABASE_URL): doc thang tick o engine/output/tick_phaisinh de thu.
export const dynamic = "force-dynamic";
const MA_CO = new Set(["VN30F1M"]);

async function docTuTickMay(soNgay) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { tickThanhM1 } = await import("@/lib/footprint");
  const goc = path.join(process.cwd(), "engine", "output", "tick_phaisinh");
  if (!fs.existsSync(goc)) return [];
  const ds = fs.readdirSync(goc).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(-soNgay);
  return ds.flatMap((f) => tickThanhM1(JSON.parse(fs.readFileSync(path.join(goc, f), "utf8")), f.slice(0, 10)));
}

export async function GET(request) {
  const coDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL);
  const thuMay = !coDb && process.env.NODE_ENV === "development";
  if (!thuMay) {
    const nguoiDung = await layNguoiDungHienTai().catch(() => null);
    if (!nguoiDung?.da_duyet) return Response.json({ trangThai: "khoa", loi: "Cần đăng nhập tài khoản thành viên" }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const q = new URL(request.url).searchParams;
  const ma = (q.get("ma") || "").toUpperCase();
  const kt = q.get("kt") || "M5";
  if (!MA_CO.has(ma)) return Response.json({ trangThai: "khong_co", loi: "Footprint hiện chỉ có cho VN30F1M" });
  const ch = CAU_HINH_KHUNG[kt];
  if (!ch) return Response.json({ trangThai: "khong_co", loi: "Footprint chỉ có ở khung trong ngày" });
  try {
    let m1;
    if (thuMay) m1 = await docTuTickMay(ch.ngay);
    else {
      const r = await withDb(async (client) => {
        await daoDamBangFootprint(client);
        return client.query(`SELECT du_lieu FROM footprint_ngay WHERE ma = $1 ORDER BY ngay DESC LIMIT $2`, [ma, ch.ngay]);
      });
      m1 = r.rows.reverse().flatMap((x) => x.du_lieu);
    }
    const du = gopFootprint(m1, kt);
    return Response.json({ trangThai: "ok", ma, ...du }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return Response.json({ loi: thongBaoLoi(e) }, { status: 500 });
  }
}
