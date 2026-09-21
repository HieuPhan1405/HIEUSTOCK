import Link from "next/link";
import Image from "next/image";
import { Phone, MessageCircle, Music2, ShieldAlert } from "lucide-react";
import { layThongTinLienHe } from "@/lib/thongTinLienHe";
import NutNoi from "@/components/NutNoi";
import { linkZalo, linkNgoai } from "@/components/kenhLienHe";

const VIEN = "#26262F";
const NEN = "#08080B";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";

const CONG_CU = [
  { href: "/", nhan: "Tổng quan thị trường" },
  { href: "/bo-loc", nhan: "Bộ lọc cổ phiếu" },
  { href: "/bieu-do", nhan: "Biểu đồ kỹ thuật" },
  { href: "/lenh-mo", nhan: "Sổ lệnh đang mở" },
  { href: "/danh-muc", nhan: "Danh mục cá nhân" },
  { href: "/lenh-da-dong", nhan: "Lệnh đã đóng" },
  { href: "/bat-day", nhan: "Checklist bắt đáy" },
];
const THONG_TIN = [
  { href: "/thi-truong", nhan: "Thông tin thị trường" },
  { href: "/huong-dan", nhan: "Hướng dẫn & nguyên tắc" },
  { href: "/lien-he", nhan: "Liên hệ" },
];

function TieuDe({ children }) {
  return (
    <h2 className="text-sm mb-3" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
      {children}
    </h2>
  );
}

function DanhSachLink({ ds }) {
  return (
    <ul className="flex flex-col gap-2">
      {ds.map((x) => (
        <li key={x.href}>
          <Link href={x.href} className="text-sm transition-colors hover:text-white" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            {x.nhan}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NutMangXaHoi({ href, nhan, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={nhan}
      title={nhan}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#2A2A36]"
      style={{ background: "#1D1D26", color: TEXT }}
    >
      {children}
    </a>
  );
}

// Chan trang dung chung moi trang: thong tin lien he (do chu web nhap o /quan-tri), lien ket nhanh,
// mang xa hoi va lu y "khong phai khuyen nghi dau tu". Neu chua nhap thong tin thi chi hien phan con lai.
export default async function ChanTrang() {
  let tt = null;
  try {
    tt = await layThongTinLienHe();
  } catch {
    tt = null;
  }
  const sdt = tt?.sdt || null;
  const hrefSdt = sdt ? `tel:${sdt.replace(/[^\d+]/g, "")}` : null;
  const hrefZalo = linkZalo(tt);
  const hrefFb = linkNgoai(tt?.facebook);
  const hrefTiktok = linkNgoai(tt?.tiktok);
  const nam = new Date().getFullYear();

  return (
    <>
      <footer className="mt-16" style={{ background: NEN, borderTop: `1px solid ${VIEN}` }}>
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" aria-label="CloudStock - về trang chính" className="inline-block mb-3">
                <Image src="/logo-day-du-toi.png" alt="CloudStock" width={640} height={427} className="w-28 h-auto" />
              </Link>
              <p className="text-sm mb-4 max-w-xs" style={{ color: MUTED }}>
                Hệ thống hỗ trợ đầu tư chứng khoán, quét toàn bộ cổ phiếu HOSE, HNX, UPCOM và cập nhật sau mỗi phiên.
              </p>
              {sdt && (
                <a href={hrefSdt} className="inline-flex items-center gap-2 text-sm hover:text-white" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
                  <Phone size={14} color={PRIMARY} aria-hidden="true" />
                  {sdt}
                </a>
              )}
            </div>

            <div>
              <TieuDe>Công cụ</TieuDe>
              <DanhSachLink ds={CONG_CU} />
            </div>

            <div>
              <TieuDe>Thông tin</TieuDe>
              <DanhSachLink ds={THONG_TIN} />
            </div>

            <div>
              <TieuDe>Theo dõi</TieuDe>
              {hrefZalo || hrefFb || hrefTiktok || hrefSdt ? (
                <div className="flex flex-wrap gap-2">
                  <NutMangXaHoi href={hrefFb} nhan="Facebook">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.1H7.5v3h2.8V21h3.2z" />
                    </svg>
                  </NutMangXaHoi>
                  <NutMangXaHoi href={hrefTiktok} nhan="TikTok">
                    <Music2 size={16} aria-hidden="true" />
                  </NutMangXaHoi>
                  <NutMangXaHoi href={hrefZalo} nhan="Zalo">
                    <MessageCircle size={16} aria-hidden="true" />
                  </NutMangXaHoi>
                  <NutMangXaHoi href={hrefSdt} nhan="Gọi điện">
                    <Phone size={16} aria-hidden="true" />
                  </NutMangXaHoi>
                </div>
              ) : (
                <Link href="/lien-he" className="text-sm hover:text-white" style={{ color: MUTED }}>
                  Xem kênh liên hệ →
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 pt-5 border-t pr-14" style={{ borderColor: VIEN }}>
            <p className="flex gap-2 text-[11px] leading-relaxed mb-3" style={{ color: MUTED }}>
              <ShieldAlert size={14} className="shrink-0 mt-px" aria-hidden="true" />
              <span>
                Nội dung trên CloudStock chỉ mang tính chất tham khảo, không phải lời khuyên hay khuyến nghị mua bán chứng khoán. Dữ liệu được cập nhật sau
                mỗi phiên giao dịch, không phải thời gian thực. Nhà đầu tư tự chịu trách nhiệm với quyết định của mình.
              </span>
            </p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              © {nam} CloudStock. Bảo lưu mọi quyền.
            </p>
          </div>
        </div>
      </footer>

      <NutNoi zalo={hrefZalo} facebook={hrefFb} />
    </>
  );
}
