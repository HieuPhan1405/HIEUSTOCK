"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LayoutDashboard, Briefcase, ListFilter, Newspaper, Mail, TrendingDown, BookOpen, History, CandlestickChart, Wallet } from "lucide-react";

const MUC = [
  { href: "/", nhan: "Tổng quan thị trường", Icon: LayoutGrid },
  { href: "/dashboard", nhan: "Dashboard thị trường", Icon: LayoutDashboard },
  { href: "/bo-loc", nhan: "Bộ lọc cổ phiếu", Icon: ListFilter },
  { href: "/bieu-do", nhan: "Biểu đồ kỹ thuật", Icon: CandlestickChart },
  { href: "/lenh-mo", nhan: "Sổ lệnh đang mở", Icon: Briefcase },
  { href: "/danh-muc", nhan: "Danh mục cá nhân", Icon: Wallet },
  { href: "/lenh-da-dong", nhan: "Lệnh đã đóng", Icon: History },
  { href: "/bat-day", nhan: "Checklist bắt đáy", Icon: TrendingDown },
  { href: "/thi-truong", nhan: "Thông tin thị trường", Icon: Newspaper },
  { href: "/huong-dan", nhan: "Hướng dẫn & nguyên tắc", Icon: BookOpen },
  { href: "/lien-he", nhan: "Liên hệ", Icon: Mail },
];

const BG = "#08080B";
const VIEN = "#26262F";
const PRIMARY = "#6C5CE7";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: sidebar doc co dinh ben trai (>=768px) */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:top-14 md:bottom-0 md:left-0 md:w-60 md:z-20"
        style={{ background: BG, borderRight: `1px solid ${VIEN}` }}
      >
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto">
          {MUC.map(({ href, nhan, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? "rgba(108,92,231,0.16)" : "transparent",
                  color: active ? PRIMARY : MUTED,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={18} strokeWidth={2} />
                {nhan}
              </Link>
            );
          })}
        </nav>

        <div
          className="px-6 py-4 text-[11px]"
          style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace", borderTop: `1px solid ${VIEN}` }}
        >
          Hệ thống hỗ trợ
          <br />
          đầu tư CloudStock
        </div>
      </aside>

      {/* Mobile: thanh ngang tren cung (<768px) */}
      <div className="md:hidden sticky top-14 z-20" style={{ background: BG, borderBottom: `1px solid ${VIEN}` }}>
        <div className="px-4 flex items-center gap-2 overflow-x-auto">
          {MUC.map(({ href, nhan, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 py-3 px-2 text-xs whitespace-nowrap border-b-2 transition-colors"
                style={{
                  borderColor: active ? PRIMARY : "transparent",
                  color: active ? TEXT : MUTED,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={14} />
                {nhan}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
