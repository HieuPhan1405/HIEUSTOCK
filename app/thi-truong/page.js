import { layTinTucThiTruong } from "@/lib/tinTuc";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { taoMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = taoMeta({
  tieuDe: "Thông tin thị trường",
  moTa: "Tin chứng khoán, vĩ mô và doanh nghiệp tổng hợp từ CafeF, cập nhật mỗi 10 phút.",
  duongDan: "/thi-truong",
});
export const revalidate = 600;

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
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
      className="flex gap-3 py-4 border-b hover:bg-[color:var(--hover-nhe)] transition-colors -mx-2 px-2 rounded-lg"
      style={{ borderColor: "var(--vien-nhe)" }}
    >
      {tin.anh && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tin.anh}
          alt=""
          className="w-24 h-16 object-cover rounded-lg shrink-0"
          style={{ background: "var(--vien-nhe)" }}
        />
      )}
      <div className="min-w-0">
        <p className="text-sm leading-snug mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 600, color: TEXT }}>
          {tin.tieuDe}
        </p>
        {tin.moTa && (
          <p className="text-xs leading-relaxed mb-1 line-clamp-2" style={{ color: MUTED }}>
            {tin.moTa}
          </p>
        )}
        <p className="text-[11px]" style={{ color: "var(--mo-3)", fontFamily: "var(--font-chu)" }}>
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
        className="text-xs  mb-1 pb-3 border-b"
        style={{ color: PRIMARY, borderColor: VIEN, fontFamily: "var(--font-chu)" }}
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
    danhSachDanhMuc = ket.danhSachDanhMuc.filter((d) => d.hien);
  } catch (e) {
    loi = thongBaoLoi(e);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Thông tin thị trường
      </h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Tin chứng khoán, vĩ mô và doanh nghiệp — tổng hợp tự động từ CafeF, cập nhật mỗi 10 phút. Bấm vào tin để đọc bài gốc ở tab mới.
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: "var(--do)" }}>
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
