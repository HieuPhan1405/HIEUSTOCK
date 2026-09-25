import { layDinhGiaThiTruong, gopTySo } from "@/lib/thiTruongHOSE";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { NGANH_NHAN } from "@/lib/nganh";
import { LICH_SU_DINH_GIA } from "@/lib/lichSuDinhGiaThiTruong";

// Dinh gia PE/PB cua thi truong (HOSE) + theo nganh + lich su hang thang: GET /api/dinh-gia-thi-truong
// Du lieu doi 1 lan/ngay nen cache dai. Phan theo nganh can bang tin_hieu (DB) - loi DB chi lam mat bang nganh, khong lam hong phan con lai.
export async function GET() {
  try {
    const dg = await layDinhGiaThiTruong();
    const { mc, pe, pb } = dg._chiTiet;
    delete dg._chiTiet;

    let theoNganh = null;
    try {
      const nhom = new Map();
      for (const r of await layTatCaTinHieu()) {
        const n = r.nganh || "Khac";
        if (!nhom.has(n)) nhom.set(n, new Set());
        nhom.get(n).add(r.ma);
      }
      theoNganh = [...nhom]
        .map(([n, tap]) => {
          const p = gopTySo(mc, pe, tap);
          const b = gopTySo(mc, pb, tap);
          return { nganh: n, nhan: NGANH_NHAN[n] ?? n, pe: p.giaTri, pb: b.giaTri, soMa: Object.keys(mc).filter((m) => tap.has(m)).length, vonHoaTy: p.tongVonHoa / 1e9 };
        })
        .filter((x) => x.soMa >= 3 && (x.pe != null || x.pb != null))
        .sort((a, b) => b.vonHoaTy - a.vonHoaTy);
    } catch {
      theoNganh = null;
    }

    return Response.json({ trangThai: "ok", ...dg, theoNganh, lichSu: LICH_SU_DINH_GIA }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch (loi) {
    return Response.json({ trangThai: "loi", thongBao: String(loi?.message || loi) }, { status: 502 });
  }
}
