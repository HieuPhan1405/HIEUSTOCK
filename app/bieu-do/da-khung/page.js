import Link from "next/link";
import { Search, LayoutGrid } from "lucide-react";
import { layTinHieuTheoMa } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import LuoiDaKhung from "@/components/LuoiDaKhung";
import ChonChiSo from "@/components/ChonChiSo";
import XemNhanhDanhSach from "@/components/XemNhanhDanhSach";
import { tinhVungLenh } from "@/components/dungChung";
import { tenCongTy } from "@/lib/tenMa";
import { taoMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
const maTuTham = (tham) => String(Array.isArray(tham?.ma) ? tham.ma[0] : tham?.ma || "VNINDEX").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "VNINDEX";

export async function generateMetadata({ searchParams }) {
  const ma = maTuTham(await searchParams);
  return taoMeta({
    tieuDe: `Biểu đồ đa khung ${ma}`,
    moTa: `Xem ${ma} ở nhiều khung thời gian (tháng, tuần, ngày, 1 giờ, 15 phút, 5 phút) trên cùng một màn hình.`,
    duongDan: `/bieu-do/da-khung?ma=${ma}`,
  });
}

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const GOI_Y = ["VNINDEX", "VN30", "VCB", "FPT", "HPG", "SSI", "STB"];

// Trang DA KHUNG (17/11/2026): 1 ma, nhieu khung thoi gian tren 1 man hinh - xem components/LuoiDaKhung.js.
export default async function TrangDaKhung({ searchParams }) {
  const ma = maTuTham(await searchParams);
  const nguoiDung = await layNguoiDungHienTai();
  let row = null;
  try {
    row = await layTinHieuTheoMa(ma);
  } catch {
    row = null;
  }
  const vung = nguoiDung?.da_duyet && row ? tinhVungLenh(row) : null;
  const ten = tenCongTy(ma);

  return (
    <div className="px-3 sm:px-4 py-3" style={{ color: TEXT }}>
      <h1 className="sr-only">Biểu đồ đa khung {ma}</h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
        <form action="/bieu-do/da-khung" method="get" className="relative w-36 shrink-0">
          <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            name="ma"
            defaultValue={ma}
            key={ma}
            autoComplete="off"
            maxLength={12}
            placeholder="Nhập mã…"
            aria-label="Mã cổ phiếu hoặc chỉ số (Enter để xem)"
            className="w-full h-8 pl-8 pr-2 text-sm outline-none rounded-lg"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)", fontWeight: 700, textTransform: "uppercase" }}
          />
        </form>
        <ChonChiSo ma={ma} duongDan="/bieu-do/da-khung" />
        {ten && (
          <p className="text-sm truncate max-w-[280px]" style={{ color: MUTED }} title={ten.ten}>
            {ten.ten} · {ten.san}
          </p>
        )}
        <Link
          href={`/bieu-do?ma=${ma}`}
          className="h-8 px-2.5 rounded-lg text-sm inline-flex items-center gap-1.5"
          style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontWeight: 600 }}
        >
          <LayoutGrid size={14} aria-hidden="true" style={{ color: "var(--tim-chu)" }} />
          Một khung
        </Link>
        <XemNhanhDanhSach ma={ma} goiY={GOI_Y} className="lg:ml-auto" duongDan="/bieu-do/da-khung" />
      </div>
      <LuoiDaKhung ma={ma} tenMa={ten?.ten ?? row?.ten_cong_ty ?? null} vung={vung} ngayMua={vung ? row.ngay_mua : null} />
    </div>
  );
}
