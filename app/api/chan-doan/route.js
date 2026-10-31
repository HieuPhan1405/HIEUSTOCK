import { withDb } from "@/lib/db";
import { layTatCaTinHieu, layTinHieuTheoMa } from "@/lib/tinHieu";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { layDinhGia, layCauChuyen } from "@/lib/noiDung";
import { layLichSuGiaoDichMa } from "@/lib/lenhDaDong";
import { layLichSuGia, layLichPhien, layNenPhutHomNay } from "@/lib/lichSuGia";
import { layKhoiNgoaiMa } from "@/lib/khoiNgoaiMa";
import { layPhanTichMa } from "@/lib/phanTichCoBanDb";

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

  // ?trang=1: do TUNG buoc du lieu ma trang Bo loc va trang chi tiet ma phai cho (ms, loi neu co) de tim buoc cham.
  if (new URL(request.url).searchParams.get("trang")) {
    const ma = (new URL(request.url).searchParams.get("ma") || "VCB").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    const buoc = {};
    const do1 = async (ten, fn) => {
      const t0 = performance.now();
      try {
        await fn();
        buoc[ten] = Math.round(performance.now() - t0);
      } catch (e) {
        buoc[ten] = { ms: Math.round(performance.now() - t0), loi: String(e?.message || e).slice(0, 120) };
      }
    };
    await do1("layTatCaTinHieu", () => layTatCaTinHieu());
    await do1("layChiBaoKyThuat", () => layChiBaoKyThuat());
    await do1("layTinHieuTheoMa", () => layTinHieuTheoMa(ma));
    await do1("layDinhGia", () => layDinhGia(ma));
    await do1("layCauChuyen", () => layCauChuyen(ma));
    await do1("layLichSuGiaoDichMa", () => layLichSuGiaoDichMa(ma));
    await do1("layLichPhien", () => layLichPhien());
    await do1("layPhanTichMa", () => layPhanTichMa(ma));
    await do1("layLichSuGiaVNINDEX50", () => layLichSuGia("VNINDEX", 50));
    await do1("layLichSuGiaMacDinh", () => layLichSuGia(ma));
    await do1("layLichSuGia400", () => layLichSuGia(ma, 400));
    await do1("layNenPhutHomNay", () => layNenPhutHomNay(ma));
    await do1("layKhoiNgoaiMa", () => layKhoiNgoaiMa(ma));
    await do1("songSong6Ma_400", () => Promise.all(["SD6", "C32", "BTS", "HOM", "THG", "DHA"].map((m) => layLichSuGia(m, 400))));
    return Response.json({ trangThai: "ok", ma, vungHam: process.env.VERCEL_REGION || null, ms: buoc });
  }

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
