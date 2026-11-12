import { layTatCaTinHieu, layTinHieuTheoMa } from "@/lib/tinHieu";
import { tenCongTy } from "@/lib/tenMa";
import { thongBaoLoi } from "@/lib/loiAnToan";

// BANG GIA NHE cho Watchlist o trang Bieu do: GET /api/bang-gia?ma=VIC,VPL,VNINDEX (toi da 80 ma). CHI tra truong CONG KHAI (gia, % doi, ten) - khong co tin hieu / gia mua, nen dung chung cho khach va thanh vien.
// Gia / % doi lay tu lan day du lieu gan nhat cua engine (cap nhat ~1 phut trong phien).
export const dynamic = "force-dynamic";

export async function GET(request) {
  const ds = [...new Set(String(new URL(request.url).searchParams.get("ma") || "").toUpperCase().split(",").map((x) => x.trim()).filter((x) => /^[A-Z0-9]{2,12}$/.test(x)))].slice(0, 80);
  if (!ds.length) return Response.json({ trangThai: "ok", ds: [] });
  try {
    const tat = new Map((await layTatCaTinHieu()).map((r) => [r.ma, r]));
    const ra = [];
    for (const ma of ds) {
      const r = tat.get(ma) ?? (ma === "VNINDEX" ? await layTinHieuTheoMa(ma).catch(() => null) : null);
      const so = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);
      const t = tenCongTy(ma);
      ra.push({ ma, ten: ma === "VNINDEX" ? "Chỉ số VN-Index" : (t?.ngan || t?.ten || null), gia: so(r?.gia), doi: so(r?.doi), luc: r?.cap_nhat_luc ?? null });
    }
    return Response.json({ trangThai: "ok", ds: ra }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: thongBaoLoi(loi) }, { status: 500 });
  }
}
