import Link from "next/link";
import { Search } from "lucide-react";
import { layTinHieuTheoMa } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";
import SignalPill from "@/components/SignalPill";
import { tinhVungLenh } from "@/components/dungChung";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Biểu đồ kỹ thuật",
  description: "Biểu đồ nến Nhật kèm Ichimoku, đường cân bằng dài hạn, MA và khối lượng cho cổ phiếu HOSE, HNX, UPCOM và VN-Index.",
};

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const GOI_Y = ["VNINDEX", "VN30", "VCB", "FPT", "HPG", "SSI", "STB"];

export default async function TrangBieuDo({ searchParams }) {
  const tham = await searchParams;
  const nhap = String(Array.isArray(tham?.ma) ? tham.ma[0] : tham?.ma || "VNINDEX");
  const ma = nhap.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "VNINDEX";

  // Vung mua/cat lo/chot loi chi hien cho nguoi da dang nhap (giong Bo loc / So lenh); ma khong co du lieu tin hieu van xem duoc bieu do.
  const nguoiDung = await layNguoiDungHienTai();
  let row = null;
  try {
    row = await layTinHieuTheoMa(ma);
  } catch {
    row = null;
  }
  const vung = nguoiDung && row ? tinhVungLenh(row) : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Biểu đồ kỹ thuật
      </h1>
      <p className="text-sm mb-5" style={{ color: MUTED }}>
        Nến Nhật, khối lượng, Ichimoku, đường cân bằng dài hạn và MA. Rê chuột (hoặc chạm trên điện thoại) để xem giá từng phiên, cuộn để phóng to/thu nhỏ.
      </p>

      <form action="/bieu-do" method="get" className="flex gap-2 mb-3 max-w-md">
        <input
          name="ma"
          defaultValue={ma}
          key={ma}
          autoComplete="off"
          maxLength={12}
          placeholder="Nhập mã (ví dụ: VCB, VNINDEX)"
          aria-label="Mã cổ phiếu"
          className="px-3 py-2 text-sm flex-1 outline-none rounded-lg"
          style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm flex items-center gap-2 shrink-0 rounded-lg cursor-pointer"
          style={{ background: PRIMARY, color: "#FFFFFF", fontWeight: 600 }}
        >
          <Search size={15} aria-hidden="true" /> Xem
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-1.5 mb-5 text-xs">
        <span style={{ color: MUTED }}>Xem nhanh:</span>
        {GOI_Y.map((g) => (
          <Link
            key={g}
            href={`/bieu-do?ma=${g}`}
            className="px-2 py-1 rounded-md border hover:text-white"
            style={{ borderColor: g === ma ? PRIMARY : VIEN, color: g === ma ? TEXT : MUTED, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {g}
          </Link>
        ))}
      </div>

      {row && ma !== "VNINDEX" && (
        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
          {nguoiDung && <SignalPill tin={row.tin} />}
          <Link href={`/ma/${ma}`} className="underline" style={{ color: PRIMARY }}>
            Xem chi tiết {ma} →
          </Link>
        </div>
      )}

      <BieuDoKyThuat ma={ma} vung={vung} ngayMua={vung ? row.ngay_mua : null} chieuCao={620} />
    </div>
  );
}
