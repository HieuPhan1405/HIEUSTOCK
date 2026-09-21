import { layTinTucThiTruong } from "@/lib/tinTuc";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Thông tin thị trường",
  description: "Tin tức vĩ mô, quốc tế và doanh nghiệp; rà soát nhanh thị trường nằm ở trang Tổng quan.",
};
export const revalidate = 600;

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";

function thoiGianTuongDoi(ngayISO) {
  if (!ngayISO) return "";
  const phut = Math.max(0, Math.round((Date.now() - new Date(ngayISO).getTime()) / 60000));
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.round(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  return `${Math.round(gio / 24)} ngày trước`;
}

function TheTin({ tin }) {
  return (
    <a
      href={tin.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 py-4 border-b hover:bg-white/[0.03] transition-colors -mx-2 px-2 rounded-lg"
      style={{ borderColor: "#1D1D26" }}
    >
      {tin.anh && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tin.anh}
          alt=""
          className="w-24 h-16 object-cover rounded-lg shrink-0"
          style={{ background: "#1D1D26" }}
        />
      )}
      <div className="min-w-0">
        <p className="text-sm leading-snug mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: TEXT }}>
          {tin.tieuDe}
        </p>
        {tin.moTa && (
          <p className="text-xs leading-relaxed mb-1 line-clamp-2" style={{ color: MUTED }}>
            {tin.moTa}
          </p>
        )}
        <p className="text-[11px]" style={{ color: "#6B6B78", fontFamily: "'JetBrains Mono', monospace" }}>
          {thoiGianTuongDoi(tin.ngayISO)} · CafeF
        </p>
      </div>
    </a>
  );
}

function CotDanhMuc({ nhan, danhSach }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p
        className="text-xs uppercase tracking-wide mb-1 pb-3 border-b"
        style={{ color: PRIMARY, borderColor: VIEN, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {nhan}
      </p>
      {danhSach.length === 0 ? (
        <p className="py-6 text-sm" style={{ color: MUTED }}>
          Chưa tải được tin từ nguồn này.
        </p>
      ) : (
        danhSach.map((tin, i) => <TheTin key={tin.link + i} tin={tin} />)
      )}
    </div>
  );
}

export default async function TrangThiTruong() {
  let theoDanhMuc = {};
  let danhSachDanhMuc = [];
  let loi = null;
  try {
    const ket = await layTinTucThiTruong();
    theoDanhMuc = ket.theoDanhMuc;
    danhSachDanhMuc = ket.danhSachDanhMuc;
  } catch (e) {
    loi = String(e?.message || e);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Thông tin thị trường
      </h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Tin vĩ mô trong nước, quốc tế và doanh nghiệp — tổng hợp tự động từ CafeF, cập nhật mỗi 10 phút. Rà soát nhanh thị trường và các lệnh mua – bán nằm ở trang Tổng quan thị trường.
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: "#EF4444" }}>
          Lỗi tải tin tức: {loi}
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {danhSachDanhMuc.map((dm) => (
          <CotDanhMuc key={dm.khoa} nhan={dm.nhan} danhSach={theoDanhMuc[dm.khoa] || []} />
        ))}
      </div>
    </div>
  );
}
