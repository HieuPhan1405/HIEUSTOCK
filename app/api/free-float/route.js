import { MA_HOP_LE } from "@/lib/lichSuGia";

// GET /api/free-float?ma=DCM -> lich su theo quy cua ty le co phieu chuyen nhuong tu do (free float) va so co phieu luu hanh, lay tu VNDirect finfo (cong khai, tu 2022-12).
// Tra ve { trangThai: "ok", ds: [{ d: "yyyy-mm-dd", ff: 0..1, sh: so co phieu }] } tang dan theo ngay. Dung cho cong cu chu nhat tren bieu do (vong quay co phieu troi noi trong vung gia).
export const dynamic = "force-dynamic";
const GOC = "https://api-finfo.vndirect.com.vn/v4/ratios";

async function lay(ma, itemCode) {
  const r = await fetch(`${GOC}?q=code:${ma}~itemCode:${itemCode}&sort=reportDate:desc&size=40`, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
  if (!r.ok) throw new Error(`VNDirect HTTP ${r.status}`);
  return (await r.json()).data ?? [];
}

export async function GET(request) {
  const ma = String(new URL(request.url).searchParams.get("ma") || "").toUpperCase();
  if (!MA_HOP_LE.test(ma)) return Response.json({ trangThai: "loi", thongBao: "Mã không hợp lệ" }, { status: 400 });
  try {
    const [ff, sh] = await Promise.all([lay(ma, 57066), lay(ma, 51004)]);
    const m = new Map();
    for (const x of ff) m.set(x.reportDate, { d: x.reportDate, ff: Math.min(1, Math.max(0.03, Number(x.value))) });
    for (const x of sh) m.set(x.reportDate, { ...(m.get(x.reportDate) ?? { d: x.reportDate }), sh: Number(x.value) });
    const ds = [...m.values()].filter((x) => x.ff > 0 && x.sh > 0).sort((a, b) => (a.d < b.d ? -1 : 1));
    return Response.json({ trangThai: "ok", ma, ds }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (e) {
    return Response.json({ trangThai: "loi", thongBao: String(e?.message || e) }, { status: 502 });
  }
}
